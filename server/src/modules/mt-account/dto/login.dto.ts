import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile: string;

  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString()
  @Length(4, 6, { message: '验证码长度为4-6位' })
  code: string;
}
