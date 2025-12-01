import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息
   */
  @Get('info')
  async getUserInfo(@CurrentUser() user: any) {
    const userWithAccounts = await this.userService.getUserWithAccounts(user.id);

    return {
      id: userWithAccounts.id.toString(),
      openid: userWithAccounts.openid,
      nickname: userWithAccounts.nickname,
      avatarUrl: userWithAccounts.avatarUrl,
      accounts: userWithAccounts.accounts.map((account) => ({
        id: account.id.toString(),
        mobile: account.mobile,
        mobileMask: this.maskMobile(account.mobile),
        provinceName: account.provinceName,
        cityName: account.cityName,
        status: account.status,
        tokenExpireAt: account.tokenExpireAt,
      })),
    };
  }

  /**
   * 更新用户信息
   */
  @Put('info')
  async updateUserInfo(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    await this.userService.update(user.id, dto);
    return { success: true };
  }

  /**
   * 手机号脱敏
   */
  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 11) return mobile;
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
}
