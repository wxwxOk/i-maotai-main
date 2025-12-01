import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendCodeDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile: string;
}
