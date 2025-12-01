import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { MtAccountService } from '../mt-account/mt-account.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('mt')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly mtAccountService: MtAccountService,
  ) {}

  /**
   * 获取可预约商品列表
   */
  @Get('items')
  async getItems() {
    const items = await this.reservationService.getItems();
    return { items };
  }

  /**
   * 手动触发预约
   */
  @Post('accounts/:id/reserve')
  async manualReserve(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const account = await this.mtAccountService.findById(BigInt(id), user.id);
    const config = await this.mtAccountService.getConfig(BigInt(id), user.id);

    if (!account.token) {
      return { success: false, message: 'Token已失效，请重新登录' };
    }

    if (!account.provinceName || !account.lat) {
      return { success: false, message: '请先设置位置信息' };
    }

    const itemCodes = config.itemCodes?.split('@') || [];
    const logs = [];

    for (const itemId of itemCodes) {
      const log = await this.reservationService.reserve(
        { ...account, config },
        itemId,
      );
      logs.push({
        itemId,
        status: log.status,
        message: log.resultMsg,
      });

      // 延迟3-5秒
      await new Promise((resolve) =>
        setTimeout(resolve, 3000 + Math.random() * 2000),
      );
    }

    return { success: true, logs };
  }

  /**
   * 获取预约日志
   */
  @Get('logs')
  async getLogs(
    @CurrentUser() user: any,
    @Query('accountId') accountId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reservationService.getLogs(user.id, {
      accountId,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      startDate,
      endDate,
    });
  }

  /**
   * 获取今日预约状态
   */
  @Get('today-status')
  async getTodayStatus(@CurrentUser() user: any) {
    return this.reservationService.getTodayStatus(user.id);
  }
}
