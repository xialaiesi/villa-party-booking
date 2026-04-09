import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as crypto from 'crypto';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

async function main() {
  // ==================== 默认商家 ====================
  const merchant = await prisma.merchant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '默认商家',
      description: '平台自营商家',
      contactName: '管理员',
      contactPhone: '13800138000',
      email: 'merchant@example.com',
      address: '杭州市余杭区径山镇',
      bankName: '招商银行',
      bankAccount: '6225880000000000',
      accountHolder: '默认商家',
      commissionRate: 0,
    },
  });

  // ==================== 平台超级管理员 ====================
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { role: 'platform', merchantId: null },
    create: {
      username: 'admin',
      password: hash('admin123'),
      nickname: '平台超管',
      role: 'platform',
      merchantId: null,
    },
  });

  // ==================== 默认商家管理员 ====================
  await prisma.admin.upsert({
    where: { username: 'merchant' },
    update: { role: 'merchant', merchantId: merchant.id },
    create: {
      username: 'merchant',
      password: hash('merchant123'),
      nickname: '默认商家',
      role: 'merchant',
      merchantId: merchant.id,
    },
  });

  // ==================== 设施 ====================
  const facilities = [
    { name: '泳池', icon: 'pool', category: '运动' },
    { name: 'KTV', icon: 'ktv', category: '娱乐' },
    { name: '烧烤', icon: 'bbq', category: '餐饮' },
    { name: '棋牌', icon: 'chess', category: '娱乐' },
    { name: '投影', icon: 'projector', category: '娱乐' },
    { name: '桌游', icon: 'board-game', category: '娱乐' },
    { name: '厨房', icon: 'kitchen', category: '餐饮' },
    { name: '停车场', icon: 'parking', category: '基础' },
    { name: 'WiFi', icon: 'wifi', category: '基础' },
    { name: '空调', icon: 'ac', category: '基础' },
    { name: '健身房', icon: 'gym', category: '运动' },
    { name: '花园', icon: 'garden', category: '基础' },
  ];
  for (const f of facilities) {
    const existing = await prisma.facility.findFirst({ where: { name: f.name, merchantId: merchant.id } });
    if (!existing) await prisma.facility.create({ data: { ...f, merchantId: merchant.id } });
  }

  // ==================== 示例别墅 ====================
  let villa = await prisma.villa.findFirst({ where: { name: '湖畔星空别墅' } });
  if (!villa) {
    villa = await prisma.villa.create({
      data: {
        merchantId: merchant.id,
        name: '湖畔星空别墅',
        description: '坐落于湖畔的豪华别墅，配备私人泳池、KTV、烧烤区，可容纳20人，是团建和生日聚会的理想之选。',
        address: '杭州市余杭区径山镇湖畔路88号',
        latitude: 30.3753,
        longitude: 119.8857,
        maxGuests: 20,
        bedrooms: 6,
        area: 500,
        basePrice: 2888,
        weekendPrice: 3888,
        deposit: 1000,
        discount3d: 0.95,
        discount5d: 0.9,
        discount7d: 0.85,
        coverImage: 'https://picsum.photos/800/600?random=1',
        tags: '团建,生日,聚会',
        status: 1,
        sortOrder: 100,
      },
    });
  }

  const villaFacilities = await prisma.facility.findMany({
    where: { merchantId: merchant.id, name: { in: ['泳池', 'KTV', '烧烤', '棋牌', '投影', '厨房', '停车场', 'WiFi', '空调', '花园'] } },
  });
  for (const f of villaFacilities) {
    await prisma.villaFacility.upsert({
      where: { villaId_facilityId: { villaId: villa.id, facilityId: f.id } },
      update: {},
      create: { villaId: villa.id, facilityId: f.id },
    });
  }

  // ==================== 示例套餐 ====================
  const packages = [
    { name: '烧烤派对套餐', description: '含烧烤架、炭火、调料、餐具，可服务20人', price: 588, weekendPrice: 688, category: '烧烤' },
    { name: 'KTV欢唱套餐', description: '专业KTV设备，含2支无线麦克风', price: 388, weekendPrice: 488, category: 'KTV' },
    { name: '生日布置套餐', description: '气球拱门、横幅、彩带、LED灯串、生日帽', price: 299, weekendPrice: 299, category: '布置' },
    { name: '桌游娱乐套餐', description: '狼人杀、UNO、三国杀等10款热门桌游', price: 168, weekendPrice: 168, category: '游戏' },
  ];
  for (const p of packages) {
    const existing = await prisma.package.findFirst({ where: { name: p.name, merchantId: merchant.id } });
    if (!existing) await prisma.package.create({ data: { ...p, merchantId: merchant.id } });
  }

  console.log('✅ Seed data created successfully!');
  console.log('   平台超管：admin / admin123');
  console.log('   默认商家：merchant / merchant123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
