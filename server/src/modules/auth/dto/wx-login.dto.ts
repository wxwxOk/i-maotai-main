import { IsNotEmpty, IsString } from 'class-validator';

export class WxLoginDto {
  @IsNotEmpty({ message: 'code不能为空' })
  @IsString()
  code: string;
}
