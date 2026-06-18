import { IsNotEmpty, IsInt, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderPackageItem {
  @IsInt()
  packageId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsInt()
  villaId: number;

  @IsNotEmpty({ message: '入住日期不能为空' })
  @IsString()
  checkIn: string;

  @IsNotEmpty({ message: '退房日期不能为空' })
  @IsString()
  checkOut: string;

  // 时段档 ID；不传则视为整天（兼容存量）
  @IsOptional()
  @IsInt()
  slotId?: number;

  @IsInt()
  @Min(1)
  guests: number;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPackageItem)
  packages?: OrderPackageItem[];
}
