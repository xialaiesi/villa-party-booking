<template>
  <div class="container help-page">
    <h2 class="page-title">帮助中心</h2>
    <p class="page-subtitle">常见问题解答，帮助您快速了解我们的服务</p>

    <div class="faq-section" v-for="section in faqSections" :key="section.title">
      <h3 class="section-title">{{ section.title }}</h3>
      <el-collapse accordion>
        <el-collapse-item v-for="(item, idx) in section.items" :key="idx" :title="item.q">
          <div class="faq-answer">{{ item.a }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="help-contact">
      <h3>没有找到答案？</h3>
      <p>如果以上内容没有解决您的问题，请联系我们的客服团队</p>
      <div class="contact-methods">
        <div class="contact-item">
          <div class="contact-icon">📞</div>
          <div class="contact-label">客服电话</div>
          <div class="contact-value">400-888-8888</div>
          <div class="contact-desc">每天 9:00 - 22:00</div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">💬</div>
          <div class="contact-label">微信客服</div>
          <div class="contact-value">villa_service</div>
          <div class="contact-desc">添加微信在线咨询</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const faqSections = [
  {
    title: '预订流程',
    items: [
      { q: '如何预订别墅？', a: '在首页或搜索页选择心仪的别墅，进入详情页后点击"立即预订"，选择入住日期和人数，填写联系信息后提交订单。提交后需先支付定金锁定日期，商家确认后再支付尾款即可。' },
      { q: '预订后多久会确认？', a: '商家通常会在2-4小时内确认您的订单。如果超过4小时未收到确认，请联系客服咨询。' },
      { q: '可以修改预订日期吗？', a: '订单提交后如需修改日期，请联系客服协助处理。已支付定金的订单修改可能会受到限制，具体以客服反馈为准。' },
      { q: '如何查看我的订单？', a: '登录后点击顶部导航的"我的订单"即可查看所有订单及其状态。' },
    ],
  },
  {
    title: '支付与退款',
    items: [
      { q: '支持哪些支付方式？', a: '目前支持微信转账、支付宝转账和银行卡转账。转账完成后商家会在后台确认到账，届时订单状态自动更新。' },
      { q: '定金和尾款分别是多少？', a: '定金通常为订单总额的30%-50%，具体金额在预订页面会明确显示。尾款为总额减去定金的部分，需要在入住前完成支付。' },
      { q: '如何申请退款？', a: '如需退款，请联系客服说明原因。入住前7天以上取消可全额退还定金；3-7天取消退还50%定金；3天内取消不予退还定金。具体政策以商家规定为准。' },
      { q: '支付失败怎么办？', a: '支付失败时系统会提示失败原因，请检查网络连接后重新尝试。如多次失败，请联系客服获取帮助。' },
    ],
  },
  {
    title: '拼团玩法',
    items: [
      { q: '什么是拼团？', a: '拼团是一种优惠活动，多个用户组团预订同一别墅可享受折扣价格。在首页"优惠活动"区域可以看到正在进行的拼团活动。' },
      { q: '如何参与拼团？', a: '点击拼团活动卡片进入详情，点击"参与拼团"即可加入。拼团达到目标人数后自动成团，未成团则全额退款。' },
      { q: '拼团成功后如何入住？', a: '拼团成功后，系统会为每位参与者生成独立订单，按照正常流程办理入住即可。' },
    ],
  },
  {
    title: '共享相册',
    items: [
      { q: '如何创建共享相册？', a: '在已完成或已入住的订单详情页，点击"创建共享相册"按钮即可创建。创建后会生成唯一邀请码，分享给朋友即可一起上传照片。' },
      { q: '如何加入别人的相册？', a: '通过朋友分享的链接直接打开相册页面，或在相册列表页输入邀请码加入。' },
      { q: '相册中的照片可以删除吗？', a: '只有照片的上传者才能删除自己上传的照片。删除操作不可恢复，请谨慎操作。' },
      { q: '相册有容量限制吗？', a: '每个相册最多可上传200张照片，单张照片大小不超过10MB。' },
    ],
  },
  {
    title: '入住须知',
    items: [
      { q: '入住和退房时间是几点？', a: '一般入住时间为当天14:00之后，退房时间为离店当天12:00之前。具体时间以商家规定为准。' },
      { q: '可以携带宠物吗？', a: '是否允许携带宠物取决于别墅的具体规定，请在预订前查看别墅详情或联系商家确认。' },
      { q: '入住人数有限制吗？', a: '每栋别墅都有最大入住人数限制，具体人数在别墅详情页会明确标注。超出人数可能需要额外收费。' },
    ],
  },
];
</script>

<style scoped>
.help-page { padding: 30px 0 80px; max-width: 800px; }
.page-title { font-size: 28px; color: #1e293b; font-weight: 800; margin-bottom: 8px; }
.page-subtitle { font-size: 15px; color: #94a3b8; margin-bottom: 36px; }

.faq-section { margin-bottom: 32px; }
.section-title {
  font-size: 18px; color: #1e293b; font-weight: 700; margin-bottom: 12px;
  padding-left: 12px; border-left: 3px solid #ff6b35;
}
.faq-answer {
  font-size: 14px; color: #64748b; line-height: 1.8;
}

.help-contact {
  margin-top: 48px; text-align: center;
  padding: 40px; background: #f8fafc; border-radius: 16px;
}
.help-contact h3 { font-size: 20px; color: #1e293b; font-weight: 700; margin-bottom: 8px; }
.help-contact > p { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }
.contact-methods { display: flex; gap: 32px; justify-content: center; }
.contact-item {
  background: #fff; padding: 24px 32px; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.contact-icon { font-size: 32px; margin-bottom: 8px; }
.contact-label { font-size: 13px; color: #94a3b8; }
.contact-value { font-size: 18px; color: #1e293b; font-weight: 700; margin: 6px 0 4px; }
.contact-desc { font-size: 12px; color: #94a3b8; }

@media (max-width: 768px) {
  .contact-methods { flex-direction: column; gap: 16px; }
}
</style>
