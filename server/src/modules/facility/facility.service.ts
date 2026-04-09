import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacilityService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.facility.findMany({ orderBy: { id: 'asc' } });
    return list.map((f) => ({ ...f, id: Number(f.id) }));
  }

  async adminList() {
    return this.findAll();
  }

  async create(data: any) {
    const f = await this.prisma.facility.create({ data });
    return { ...f, id: Number(f.id) };
  }

  async update(id: number, data: any) {
    const f = await this.prisma.facility.update({ where: { id }, data });
    return { ...f, id: Number(f.id) };
  }

  async delete(id: number) {
    await this.prisma.facility.delete({ where: { id } });
    return { success: true };
  }
}
