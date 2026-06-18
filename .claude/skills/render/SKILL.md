---
name: render
user-invocable: true
description: |
    分镜剧本渲染流水线。读取 video/{日期}/ 下由 video skill 生成的分镜剧本 md，
    逐镜调用 DeeVid AI Open API：先文生图生成每镜首帧，再图生视频生成片段，
    产物（图片/视频/日志）存回剧本同一目录，供用户剪辑。
    Use when the user wants to actually render a storyboard script into images and videos
    by calling the DeeVid AI Open API, step by step, saving outputs to the same folder.
---

# Render — 分镜剧本渲染流水线（DeeVid AI Open API）

你是 AIGC 视频生产流水线工程师。把 `video` skill 产出的分镜剧本，逐镜调用
DeeVid AI Open API 渲染成「首帧图 → 视频片段」，全部存回剧本所在目录。

## 触发条件

- 用户说 `/render` 并指定一个剧本文件或目录
- 用户说"渲染这个剧本"、"把分镜生成图片和视频"、"调 DeeVid 出图出片"

## 输入

- 一个剧本 md（如 `video/2026-05-29/末日逃生-变体A-蓝方块变现代玻璃别墅.md`）
- 或一个日期目录（批量渲染该目录下所有剧本 md）

## API 配置（DeeVid AI Open API）

- **Base URL**：环境变量 `DEEVID_BASE_URL`，默认 `http://127.0.0.1:3010`
- **认证**：所有请求头 `Authorization: Bearer $DEEVID_API_KEY`（环境变量 `DEEVID_API_KEY`）
- **任务模型**：异步任务制 —— 提交返回 `data.taskId`，再轮询状态查结果
- **任务状态**：`GET {base}/v1/open-api/task/status?taskId={id}`，状态流转 `INIT → PROCESSING → SUCCESS / FAIL`；成功返回 `resultImageUrls`（图）或 `resultVideoUrls`/`resultVideoUrl`（视频）
- **size 枚举**：`SIXTEEN_BY_NINE`（横屏，默认）/ `NINE_BY_SIXTEEN`（竖屏）/ `ONE_BY_ONE`
- **图像模型**：`Nano Banana Pro`（默认）/ `Nano Banana 2` / `V2.0`，resolution `1K/2K/4K`
- **视频模型**：`Quality V2.0`（默认）/ `Quality V2.5` / `Fast V2.0` / `Fast V2.1` / `Master V2.0` / `Master V4.0`，resolution `720p/1080p`

横屏视频默认用 `SIXTEEN_BY_NINE` + `720p`，与剧本 1280x720 一致。

## 工作流程

### Step 0: 连通性检查（先做）

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $DEEVID_API_KEY" \
  "${DEEVID_BASE_URL:-http://127.0.0.1:3010}/v1/open-api/quota"
```

- 返回 200 → 继续；非 200 或连接失败 → 停下，提示用户检查 `DEEVID_BASE_URL` / `DEEVID_API_KEY` 与服务是否启动，**不要伪造产物**。

### Step 1: 解析剧本

用 Read 读取剧本 md，提取：场景 / 道具 / 别墅风格 / 角色锚点；每镜的编号、英文 Prompt（优先喂英文）、运镜、时长。中文 Prompt 留作参考。

### Step 2: 建立产物目录

产物存回剧本同目录，按剧本名建子目录：

```bash
mkdir -p "video/2026-05-29/{剧本名}"
```
```
video/2026-05-29/{剧本名}/
  ├── shot1.png shot2.png shot3.png shot4.png   # 每镜首帧
  ├── shot1.mp4 shot2.mp4 shot3.mp4 shot4.mp4   # 每镜视频
  └── render-log.json                           # 每镜 taskId/prompt/参数/产物/状态
```

### Step 3: 逐镜生成首帧（首图文生图，后续图生图链式接力）

**核心：第一视角 + 场景一致性。** 镜头 1 用文生图定调；镜头 2/3/4 用图生图，
以「上一镜首帧」为参考图，只描述本镜动作变化，继承环境/光线/双手/道具。每镜 prompt 拼上第一视角锚点。

**3a. 镜头 1 — 文生图（text-to-image）：**
```bash
TASK=$(curl -s -X POST "$DEEVID_BASE_URL/v1/open-api/image/text-to-image/task/submit" \
  -H "Authorization: Bearer $DEEVID_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"Nano Banana Pro","prompt":"First-person POV, <场景锚点 + 镜头1 英文 prompt>","count":1,"size":"SIXTEEN_BY_NINE","resolution":"2K"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['taskId'])")
```

**3b. 轮询并下载（注意结果竞态，见轮询策略）：**
```bash
IMG_URL=$(curl -s -H "Authorization: Bearer $DEEVID_API_KEY" \
  "$DEEVID_BASE_URL/v1/open-api/task/status?taskId=$TASK" \
  | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print((d.get('resultImageUrls') or [''])[0])")
curl -sS -A "Mozilla/5.0" -o "video/2026-05-29/{剧本名}/shot1.png" "$IMG_URL"
```

**3c. 镜头 2/3/4 — 图生图（image-to-image），参考上一镜首帧：**
先把上一镜首帧上传拿 `userImageId`（见 Step 4），再：
```bash
TASK=$(curl -s -X POST "$DEEVID_BASE_URL/v1/open-api/image/image-to-image/task/submit" \
  -H "Authorization: Bearer $DEEVID_API_KEY" -H "Content-Type: application/json" \
  -d "{\"model\":\"Nano Banana Pro\",\"prompt\":\"First-person POV, <本镜动作变化，如：抬手把发光道具掷向前方>\",\"userImageIds\":[$PREV_IMG_ID],\"count\":1,\"size\":\"SIXTEEN_BY_NINE\",\"resolution\":\"2K\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['taskId'])")
```
然后同 3b 轮询下载为 `shotN.png`。图生图 prompt 只写"相对上一帧的变化"，保证场景延续。

- 横构图，与视频比例一致；生成后可向用户展示首帧路径，让其确认/重抽再继续。

### Step 4: 上传首帧拿 userImageId

图生视频、以及下一镜图生图都需要 `userImageId`，把每镜首帧上传：
```bash
IMG_ID=$(curl -s -X POST "$DEEVID_BASE_URL/v1/open-api/file-upload/upload/image" \
  -H "Authorization: Bearer $DEEVID_API_KEY" \
  -F "file=@video/2026-05-29/{剧本名}/shotN.png" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['userImageId'])")
```
此 `IMG_ID` 既用于本镜图生视频（Step 5），也作为下一镜图生图的参考图（Step 3c 的 `PREV_IMG_ID`）。

### Step 5: 逐镜图生视频（片段）

用首帧 `userImageId` + 镜头 prompt + 时长，提交起始图生视频任务：

**5a. 提交（start_image）：**
```bash
VTASK=$(curl -s -X POST "$DEEVID_BASE_URL/v1/open-api/image-video/start-image/task/submit" \
  -H "Authorization: Bearer $DEEVID_API_KEY" -H "Content-Type: application/json" \
  -d "{\"model\":\"Quality V2.0\",\"userImageId\":$IMG_ID,\"prompt\":\"<镜头英文 prompt（动作描述）>\",\"resolution\":\"720p\",\"duration\":5,\"size\":\"SIXTEEN_BY_NINE\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['taskId'])")
```

**5b. 轮询并下载视频：**
```bash
# 退避轮询 task/status，SUCCESS 后取 resultVideoUrls[0]（或 resultVideoUrl）
VURL=$(curl -s -H "Authorization: Bearer $DEEVID_API_KEY" \
  "$DEEVID_BASE_URL/v1/open-api/task/status?taskId=$VTASK" \
  | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print((d.get('resultVideoUrls') or [d.get('resultVideoUrl','')])[0] if d.get('status')=='SUCCESS' else '')")
curl -s -o "video/2026-05-29/{剧本名}/shot1.mp4" "$VURL"
```

**连贯性进阶（可选，首尾帧接力）：**
若要镜头间衔接更顺，用首尾帧接口 `image-video/between-images/task/submit`，
body 传 `{"model":"Master V4.0","mode":"between_images","userImageId":<本镜首帧>,"endFrameImageId":<下镜首帧>,"prompt":...,"duration":5}`，
用本镜首帧 + 下镜首帧做平滑过渡。

### Step 6: 写日志 + 汇总

写 `render-log.json`，每镜记录 taskId（图/视频）、prompt、参数、产物路径、状态、耗时。
向用户输出汇总表 + 目录路径 + 剪辑提示（直接引用剧本里的剪辑/转场建议）。

## 轮询策略

- 退避：每次 8-10s，图任务总超时约 5 分钟、视频约 10 分钟（实测图~3min、视频~2-4min）
- **结果竞态**（重要踩坑）：`status` 先变 `SUCCESS`，`resultImageUrls`/`resultVideoUrl` 会晚几百毫秒到几秒才落库。**判定完成必须同时满足 status==SUCCESS 且对应结果字段非空**，否则继续轮询，不能一见 SUCCESS 就取结果（会 KeyError）。
- 提交后立即记录 taskId（数字）到日志，便于中断后用 taskId 续查
- `status==FAIL` 即停该镜并记录错误信息，重试最多 2 次后跳过

## 下载注意（踩坑）

- 结果 CDN（cdn2.deevid.ai / volces TOS）**会拦截 Python-urllib 默认 UA 返回 403**。下载图片/视频一律用 `curl -sS -A "Mozilla/5.0" -o 文件 URL`，不要用 urllib.urlretrieve。
- 视频 URL 是带签名的临时链接（X-Tos-Expires=86400，1天），需尽快下载落盘。

## 输出格式

```
================================
  渲染完成 — {剧本名}
================================

## 环境
DeeVid Open API @ {DEEVID_BASE_URL}
图像模型：Nano Banana Pro | 视频模型：Quality V2.0

## 产物目录
video/{日期}/{剧本名}/

## 逐镜结果
| 镜头 | 图 taskId | 首帧图 | 视频 taskId | 视频 | 状态 |
|------|-----------|--------|-------------|------|------|
| 1 | ... | shot1.png | ... | shot1.mp4 | ✅ |
| 2 | ... | shot2.png | ... | shot2.mp4 | ✅ |
| 3 | ... | shot3.png | ... | shot3.mp4 | ⚠️ 重试1次 |
| 4 | ... | shot4.png | ... | shot4.mp4 | ✅ |

## 下一步
- 按剧本「剪辑衔接建议」拼接 shot1-4.mp4
- 不满意的镜头：重跑 /render 时指定只渲该镜
```

## 安全与边界

- **不伪造产物** — API 不可用/任务 FAIL 就如实报告并停下，绝不生成假图/假视频/假路径
- **串行优先** — 逐镜串行，便于人物一致性接力和用户中途确认首帧
- **幂等可续** — 已存在且成功的 png/mp4 默认跳过；支持只重渲指定镜头；taskId 入日志可续查
- **存回原目录** — 产物全部写入剧本所在 `video/{日期}/{剧本名}/`
- **密钥安全** — API key 只从环境变量读取，绝不写进日志/产物/代码

## 原则

- 一切以 DeeVid Open API 真实返回为准；模型名/size/分辨率可被用户覆盖
- 图生视频 > 文生视频：先出首帧、必要时让用户确认，再图生视频，连贯性最好
- 流水线每步都有可见产物（taskId + 文件）和日志，方便用户介入和复跑
