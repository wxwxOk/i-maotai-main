import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MtAccountService } from './mt-account.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendCodeDto } from './dto/send-code.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('mt')
@UseGuards(JwtAuthGuard)
export class MtAccountController {
  constructor(private readonly mtAccountService: MtAccountService) {}

  /**
   * 发送验证码
   */
  @Post('send-code')
  async sendCode(@CurrentUser() user: any, @Body() dto: SendCodeDto) {
    await this.mtAccountService.sendCode(user.id, dto.mobile);
    return { success: true, message: '验证码已发送' };
  }

  /**
   * 登录i茅台
   */
  @Post('login')
  async login(@CurrentUser() user: any, @Body() dto: LoginDto) {
    const account = await this.mtAccountService.login(
      user.id,
      dto.mobile,
      dto.code,
    );
    return {
      success: true,
      account: {
        id: account.id.toString(),
        mobile: account.mobile,
        status: account.status,
      },
    };
  }

  /**
   * 获取账号列表
   */
  @Get('accounts')
  async getAccounts(@CurrentUser() user: any) {
    const accounts = await this.mtAccountService.findByUserId(user.id);
    return {
      accounts: accounts.map((account) => ({
        id: account.id.toString(),
        mobile: account.mobile,
        mobileMask: this.maskMobile(account.mobile),
        provinceName: account.provinceName,
        cityName: account.cityName,
        address: account.address,
        status: account.status,
        tokenExpireAt: account.tokenExpireAt,
        isExpired: account.tokenExpireAt
          ? new Date() > account.tokenExpireAt
          : true,
      })),
    };
  }

  /**
   * 获取账号详情
   */
  @Get('accounts/:id')
  async getAccountDetail(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const account = await this.mtAccountService.findById(BigInt(id), user.id);
    const config = await this.mtAccountService.getConfig(BigInt(id), user.id);

    return {
      id: account.id.toString(),
      mobile: account.mobile,
      mobileMask: this.maskMobile(account.mobile),
      provinceName: account.provinceName,
      cityName: account.cityName,
      lat: account.lat,
      lng: account.lng,
      address: account.address,
      status: account.status,
      tokenExpireAt: account.tokenExpireAt,
      isExpired: account.tokenExpireAt
        ? new Date() > account.tokenExpireAt
        : true,
      config: {
        itemCodes: config.itemCodes,
        shopType: config.shopType,
        reserveMinute: config.reserveMinute,
        randomMinute: config.randomMinute,
        autoTravel: config.autoTravel,
        isEnabled: config.isEnabled,
      },
    };
  }

  /**
   * 删除账号
   */
  @Delete('accounts/:id')
  async deleteAccount(@CurrentUser() user: any, @Param('id') id: string) {
    await this.mtAccountService.delete(BigInt(id), user.id);
    return { success: true };
  }

  /**
   * 更新账号位置
   */
  @Put('accounts/:id/location')
  async updateLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    await this.mtAccountService.updateLocation(BigInt(id), user.id, dto);
    return { success: true };
  }

  /**
   * 获取预约配置
   */
  @Get('accounts/:id/config')
  async getConfig(@CurrentUser() user: any, @Param('id') id: string) {
    const config = await this.mtAccountService.getConfig(BigInt(id), user.id);
    return {
      itemCodes: config.itemCodes,
      shopType: config.shopType,
      reserveMinute: config.reserveMinute,
      randomMinute: config.randomMinute,
      autoTravel: config.autoTravel,
      isEnabled: config.isEnabled,
    };
  }

  /**
   * 更新预约配置
   */
  @Put('accounts/:id/config')
  async updateConfig(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
  ) {
    await this.mtAccountService.updateConfig(BigInt(id), user.id, dto);
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
