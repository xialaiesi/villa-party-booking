import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员（密码: admin123）
  const hashedPassword = crypto
    .createHash('sha256')
    .update('admin123')
    .digest('hex');

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
    },
  });

  // 创建设施字典
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
    await prisma.facility.upsert({
      where: { id: facilities.indexOf(f) + 1 },
      update: {},
      create: f,
    });
  }

  // 创建示例别墅
  const villa = await prisma.villa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '湖畔星空别墅',
      description:
        '坐落于湖畔的豪华别墅，配备私人泳池、KTV、烧烤区，可容纳20人，是团建和生日聚会的理想之选。',
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

  // 关联设施
  const villaFacilities = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12]; // 泳池、KTV、烧烤等
  for (const fId of villaFacilities) {
    await prisma.villaFacility.upsert({
      where: { villaId_facilityId: { villaId: villa.id, facilityId: fId } },
      update: {},
      create: { villaId: villa.id, facilityId: fId },
    });
  }

  // 创建示例套餐
  const packages = [
    {
      name: '烧烤派对套餐',
      description: '含烧烤架、炭火、调料、餐具，可服务20人',
      price: 588,
      weekendPrice: 688,
      category: '烧烤',
    },
    {
      name: 'KTV欢唱套餐',
      description: '专业KTV设备，含2支无线麦克风',
      price: 388,
      weekendPrice: 488,
      category: 'KTV',
    },
    {
      name: '生日布置套餐',
      description: '气球拱门、横幅、彩带、LED灯串、生日帽',
      price: 299,
      weekendPrice: 299,
      category: '布置',
    },
    {
      name: '桌游娱乐套餐',
      description: '狼人杀、UNO、三国杀等10款热门桌游',
      price: 168,
      weekendPrice: 168,
      category: '游戏',
    },
  ];

  for (let i = 0; i < packages.length; i++) {
    await prisma.package.upsert({
      where: { id: i + 1 },
      update: {},
      create: packages[i],
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
