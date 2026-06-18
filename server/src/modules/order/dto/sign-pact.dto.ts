import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class SignPactDto {
  @IsNotEmpty({ message: '带队人姓名不能为空' })
  @IsString()
  leaderName: string;

  @IsNotEmpty({ message: '带队人手机不能为空' })
  @IsString()
  leaderPhone: string;

  @IsOptional()
  @IsString()
  leaderIdTail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  partySize?: number;
}
