import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class RescheduleDto {
  @IsNotEmpty({ message: '入住日期不能为空' })
  @IsString()
  checkIn: string;

  @IsOptional()
  @IsString()
  checkOut?: string;

  // 时段档 ID；不传则视为整天
  @IsOptional()
  @IsInt()
  slotId?: number;
}
