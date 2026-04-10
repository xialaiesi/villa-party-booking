import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

// 默认商家 id（SaaS 模式）
const MERCHANT_ID = 1n;

async function main() {
  // 确保默认商家存在
  const merchant = await prisma.merchant.findUnique({ where: { id: MERCHANT_ID } });
  if (!merchant) {
    console.error('❌ 默认商家 (id=1) 不存在，请先运行 seed.ts');
    process.exit(1);
  }

  // ==================== 氛围包 ====================
  const themePacks = [
    {
      merchantId: MERCHANT_ID,
      name: '赛博朋克之夜',
      theme: '赛博朋克',
      description: '紫粉霓虹灯光 + 电音音响 + 未来感装饰，打造沉浸式赛博朋克夜晚',
      price: 999,
      originalPrice: 1400,
      coverImage: 'https://picsum.photos/800/600?random=10',
      items: JSON.stringify(['RGB 霓虹灯带 10 米', '激光投影灯 × 2', '电音音响一套', '全息立牌 × 4', '荧光手环 × 30', '赛博主题桌布']),
    },
    {
      merchantId: MERCHANT_ID,
      name: '复古迪斯科',
      theme: '复古',
      description: '80 年代风情 + 旋转镜球 + 复古音响，带你穿越回迪斯科黄金年代',
      price: 888,
      originalPrice: 1200,
      coverImage: 'https://picsum.photos/800/600?random=11',
      items: JSON.stringify(['旋转镜球灯', '复古海报 × 10', 'DJ 台设备', '唱片装饰', '复古服装道具 × 20']),
    },
    {
      merchantId: MERCHANT_ID,
      name: '露营野趣包',
      theme: '露营',
      description: '天幕 + 篝火 + 野餐垫，在别墅花园里也能享受户外野营氛围',
      price: 699,
      originalPrice: 950,
      coverImage: 'https://picsum.photos/800/600?random=12',
      items: JSON.stringify(['防水天幕 4x6 米', '折叠桌椅 × 6 套', '篝火架 + 柴火', '野餐垫 × 2', '串灯 20 米', '野餐篮 × 4']),
    },
    {
      merchantId: MERCHANT_ID,
      name: 'ins 风少女心',
      theme: 'ins风',
      description: '马卡龙色系 + 蝴蝶结 + 鲜花点缀，随手一拍都是朋友圈大片',
      price: 799,
      originalPrice: 1100,
      coverImage: 'https://picsum.photos/800/600?random=13',
      items: JSON.stringify(['粉色气球拱门', '马卡龙色餐具套装', '鲜花摆件 × 5', '拍照背景墙', '绸带装饰', 'ins 风相框 × 10']),
    },
    {
      merchantId: MERCHANT_ID,
      name: '生日派对豪华包',
      theme: '派对',
      description: '生日专属 - 气球拱门 + 主题蛋糕 + 烟花棒 + 惊喜道具',
      price: 599,
      originalPrice: 850,
      coverImage: 'https://picsum.photos/800/600?random=14',
      items: JSON.stringify(['气球拱门', '生日横幅', 'LED 数字灯', '烟花棒 × 30', '礼花彩带', '生日帽 × 20', '拍立得 + 胶片']),
    },
    {
      merchantId: MERCHANT_ID,
      name: '电竞开黑夜',
      theme: '派对',
      description: '投影仪 + 电竞椅 + 零食自助，和兄弟们一起通宵开黑',
      price: 688,
      originalPrice: 900,
      coverImage: 'https://picsum.photos/800/600?random=15',
      items: JSON.stringify(['高清投影仪', '电竞椅 × 6', '游戏手柄 × 4', '零食自助车', '能量饮料 × 24', '氛围灯带']),
    },
  ];

  for (const pack of themePacks) {
    const existing = await prisma.themePack.findFirst({ where: { name: pack.name } });
    if (!existing) {
      await prisma.themePack.create({ data: pack as any });
      console.log(`✅ 氛围包: ${pack.name}`);
    }
  }

  // ==================== 周边服务 ====================
  const services = [
    { merchantId: MERCHANT_ID, name: '烧烤大厨上门', category: '厨师', description: '专业烧烤师傅到店服务，提供全套烤制技巧和精品酱料', price: 688, unit: '次', provider: '老王烤肉工作室', phone: '138xxxx1234', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=20' },
    { merchantId: MERCHANT_ID, name: '私厨上门（8人餐）', category: '厨师', description: '星级酒店大厨到店，为您定制 8-10 人私房菜', price: 1288, unit: '次', provider: '味蕾私厨', phone: '138xxxx1235', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=21' },
    { merchantId: MERCHANT_ID, name: '摄影跟拍 4 小时', category: '摄影', description: '专业单反 + 修图师，全程跟拍聚会精彩瞬间', price: 888, unit: '次', provider: 'LightStudio', phone: '138xxxx2234', serviceArea: '杭州+周边', coverImage: 'https://picsum.photos/600/400?random=22' },
    { merchantId: MERCHANT_ID, name: '航拍摄影', category: '摄影', description: '无人机航拍团建合影和别墅环境，适合大团建', price: 588, unit: '次', provider: 'LightStudio', phone: '138xxxx2235', serviceArea: '杭州+周边', coverImage: 'https://picsum.photos/600/400?random=23' },
    { merchantId: MERCHANT_ID, name: 'DJ 驻场', category: 'DJ', description: '专业 DJ 携设备上门，根据场景定制歌单，4 小时嗨翻全场', price: 1188, unit: '次', provider: 'BeatDrop', phone: '138xxxx3234', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=24' },
    { merchantId: MERCHANT_ID, name: '专业调酒师', category: '调酒', description: '花式调酒师 + 10 款经典鸡尾酒 + 调酒秀', price: 788, unit: '次', provider: 'Bar Talent', phone: '138xxxx4234', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=25' },
    { merchantId: MERCHANT_ID, name: '生日蛋糕定制', category: '蛋糕', description: '根据主题定制 8 寸生日蛋糕 + 配送到别墅', price: 368, unit: '个', provider: '甜蜜手作', phone: '138xxxx5234', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=26' },
    { merchantId: MERCHANT_ID, name: '亲子活动教练', category: '教练', description: '亲子活动策划 + 游戏引导，专为家庭聚会设计', price: 488, unit: '次', provider: '欢乐童年', phone: '138xxxx6234', serviceArea: '杭州+周边', coverImage: 'https://picsum.photos/600/400?random=27' },
    { merchantId: MERCHANT_ID, name: '团建破冰教练', category: '教练', description: '专业团建教练，6 小时破冰游戏 + 团队拓展活动', price: 1588, unit: '天', provider: '聚力团建', phone: '138xxxx6235', serviceArea: '杭州主城区', coverImage: 'https://picsum.photos/600/400?random=28' },
  ];

  for (const svc of services) {
    const existing = await prisma.localService.findFirst({ where: { name: svc.name } });
    if (!existing) {
      await prisma.localService.create({ data: svc as any });
      console.log(`✅ 周边服务: ${svc.name}`);
    }
  }

  // ==================== 活动方案 ====================
  const plans = [
    {
      merchantId: MERCHANT_ID,
      name: '团建破冰 · 精英小队',
      description: '6 小时专业团建流程：破冰游戏 + 团队协作挑战 + 晚间烧烤复盘，适合 10-20 人公司团建',
      scene: '团建',
      minGuests: 10,
      maxGuests: 20,
      duration: '6 小时',
      coverImage: 'https://picsum.photos/800/600?random=40',
      sortOrder: 10,
    },
    {
      merchantId: MERCHANT_ID,
      name: '生日惊喜派对',
      description: '气球拱门 + 定制蛋糕 + 惊喜快闪 + 拍立得合影，全程策划不用操心',
      scene: '生日',
      minGuests: 6,
      maxGuests: 15,
      duration: '4 小时',
      coverImage: 'https://picsum.photos/800/600?random=41',
      sortOrder: 20,
    },
    {
      merchantId: MERCHANT_ID,
      name: '闺蜜下午茶派对',
      description: 'ins 风下午茶布置 + 专业摄影跟拍 + 轻食茶点，4 小时拍照拍到手软',
      scene: '聚会',
      minGuests: 4,
      maxGuests: 10,
      duration: '4 小时',
      coverImage: 'https://picsum.photos/800/600?random=42',
      sortOrder: 30,
    },
    {
      merchantId: MERCHANT_ID,
      name: '亲子欢乐营',
      description: '亲子手工 + 烘焙体验 + 户外寻宝 + 儿童安全照护，让孩子玩到不想回家',
      scene: '亲子',
      minGuests: 6,
      maxGuests: 16,
      duration: '全天',
      coverImage: 'https://picsum.photos/800/600?random=43',
      sortOrder: 40,
    },
    {
      merchantId: MERCHANT_ID,
      name: '同学聚会怀旧夜',
      description: '复古迪斯科 + KTV 点歌 + 烧烤夜宵 + 回忆相册，重温校园岁月',
      scene: '聚会',
      minGuests: 8,
      maxGuests: 20,
      duration: '8 小时',
      coverImage: 'https://picsum.photos/800/600?random=44',
      sortOrder: 50,
    },
    {
      merchantId: MERCHANT_ID,
      name: '电竞开黑通宵局',
      description: '投影大屏 + 电竞椅 + 零食自助 + 能量饮料，兄弟通宵开黑嗨到天亮',
      scene: '聚会',
      minGuests: 4,
      maxGuests: 8,
      duration: '12 小时',
      coverImage: 'https://picsum.photos/800/600?random=45',
      sortOrder: 60,
    },
    {
      merchantId: MERCHANT_ID,
      name: '求婚浪漫夜',
      description: '玫瑰花瓣 + 烛光晚餐 + 现场小提琴 + 烟花倒计时，打造一生难忘的告白',
      scene: '生日',
      minGuests: 2,
      maxGuests: 10,
      duration: '4 小时',
      coverImage: 'https://picsum.photos/800/600?random=46',
      sortOrder: 70,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.activityPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.activityPlan.create({ data: plan as any });
      console.log(`✅ 活动方案: ${plan.name}`);
    }
  }

  // ==================== 限定活动 ====================
  const now = new Date();
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const events = [
    {
      merchantId: MERCHANT_ID,
      name: '夏日泳池电音节',
      description: '7 月限定 - 私人泳池 + 专业 DJ + 荧光装备，打造专属水上音乐派对',
      coverImage: 'https://picsum.photos/800/600?random=30',
      season: 'summer',
      startDate: new Date(now.getFullYear(), 6, 1),
      endDate: new Date(now.getFullYear(), 7, 31),
      discount: 500,
      quota: 20,
      soldCount: 3,
      villaId: 1n,
    },
    {
      merchantId: MERCHANT_ID,
      name: '万圣节惊魂夜',
      description: '10 月限定 - 南瓜装饰 + 恐怖剧本杀 + 变装派对，胆小勿入',
      coverImage: 'https://picsum.photos/800/600?random=31',
      season: 'autumn',
      startDate: new Date(now.getFullYear(), 9, 20),
      endDate: new Date(now.getFullYear(), 10, 2),
      discount: 300,
      quota: 15,
      soldCount: 0,
      villaId: 1n,
    },
    {
      merchantId: MERCHANT_ID,
      name: '跨年倒计时派对',
      description: '12 月限定 - 香槟塔 + 烟花 + 倒计时氛围，和最好的朋友一起迎接新年',
      coverImage: 'https://picsum.photos/800/600?random=32',
      season: 'winter',
      startDate: new Date(now.getFullYear(), 11, 28),
      endDate: new Date(now.getFullYear() + 1, 0, 2),
      discount: 800,
      quota: 10,
      soldCount: 0,
      villaId: 1n,
    },
    {
      merchantId: MERCHANT_ID,
      name: '春日樱花野餐趴',
      description: '3 月限定 - 樱花主题布置 + 户外野餐 + 和风拍照道具',
      coverImage: 'https://picsum.photos/800/600?random=33',
      season: 'spring',
      startDate: new Date(now.getFullYear(), 2, 15),
      endDate: new Date(now.getFullYear(), 3, 15),
      discount: 400,
      quota: 25,
      soldCount: 5,
      villaId: 1n,
    },
    {
      merchantId: MERCHANT_ID,
      name: '新品体验尝鲜价',
      description: '限时 7 天 - 平台新用户专享首单立减，适合所有场景',
      coverImage: 'https://picsum.photos/800/600?random=34',
      season: 'spring',
      startDate: addDays(now, -2),
      endDate: addDays(now, 7),
      discount: 200,
      quota: 50,
      soldCount: 8,
      villaId: 1n,
    },
  ];

  for (const event of events) {
    const existing = await prisma.seasonalEvent.findFirst({ where: { name: event.name } });
    if (!existing) {
      await prisma.seasonalEvent.create({ data: event as any });
      console.log(`✅ 限定活动: ${event.name}`);
    }
  }

  console.log('\n✨ 所有数据导入完成！');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
