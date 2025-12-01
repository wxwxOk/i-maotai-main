import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MtApiService } from '../../mt-api/mt-api.service';
import { MtAccountService } from '../../mt-account/mt-account.service';
import { ReservationService } from '../../reservation/reservation.service';
import { WechatService } from '../../wechat/wechat.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * 预约定时任务
 */
@Injectable()
export class ReserveTask {
  private readonly logger = new Logger(ReserveTask.name);

  constructor(
    private readonly mtApiService: MtApiService,
    private readonly mtAccountService: MtAccountService,
    private readonly reservationService: ReservationService,
    private readonly wechatService: WechatService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 每天8:00刷新版本号、商品和门店数据
   */
  @Cron('0 0 8 * * *')
  async refreshData() {
    this.logger.log('========== 开始刷新数据 ==========');
    try {
      // 刷新版本号
      const version = await this.mtApiService.getMtVersion();
      this.logger.log(`当前i茅台版本: ${version}`);

      // 刷新商品列表
      const items = await this.reservationService.getItems();
      this.logger.log(`刷新商品完成, 商品数: ${items.length}`);

      this.logger.log('========== 刷新数据完成 ==========');
    } catch (error) {
      this.logger.error('刷新数据失败', error);
    }
  }

  /**
   * 每天9:00-9:30每分钟执行预约
   * 根据用户配置的分钟数执行
   */
  @Cron('0 0-30 9 * * *')
  async executeReservation() {
    const currentMinute = new Date().getMinutes();
    this.logger.log(`========== 执行预约任务 [分钟:${currentMinute}] ==========`);

    try {
      // 1. 获取当前分钟需要预约的账号
      const accounts = await this.mtAccountService.findByReserveMinute(currentMinute);
      this.logger.log(`待预约账号数: ${accounts.length}`);

      if (accounts.length === 0) {
        this.logger.log('没有需要预约的账号');
        return;
      }

      // 2. 遍历账号执行预约
      for (const account of accounts) {
        await this.reserveForAccount(account);
        // 随机延迟3-5秒
        await this.delay(3000 + Math.random() * 2000);
      }

      this.logger.log('========== 预约任务执行完成 ==========');
    } catch (error) {
      this.logger.error('预约任务执行失败', error);
    }
  }

  /**
   * 每天18:00查询预约结果
   */
  @Cron('0 0 18 * * *')
  async queryResults() {
    this.logger.log('========== 开始查询预约结果 ==========');
    try {
      // 1. 获取所有启用的账号
      const accounts = await this.mtAccountService.findAllEnabled();

      // 2. 遍历查询结果
      for (const account of accounts) {
        try {
          const results = await this.mtApiService.queryReservationResult(
            account.token,
            account.deviceId,
          );

          // 3. 处理中签结果
          for (const result of results) {
            if (result.status === 2) {
              // 中签状态
              // 更新日志状态
              await this.prisma.reservationLog.updateMany({
                where: {
                  accountId: account.id,
                  itemId: result.itemId,
                  status: 1,
                },
                data: {
                  status: 3, // 更新为中签
                  shopName: result.shopName,
                },
              });

              // 发送中签通知
              const user = await this.prisma.user.findFirst({
                where: { accounts: { some: { id: account.id } } },
              });

              if (user) {
                await this.wechatService.sendWinNotify({
                  userId: user.id,
                  itemName: result.itemName || '茅台酒',
                  shopName: result.shopName || '指定门店',
                  payDeadline: '次日18:00前',
                  pickupDeadline: '7天内',
                });
              }

              this.logger.log(`🎉 中签: ${account.mobile} - ${result.itemName}`);
            }
          }

          await this.delay(1000);
        } catch (error) {
          this.logger.error(`查询账号${account.mobile}结果失败`, error);
        }
      }

      this.logger.log('========== 查询预约结果完成 ==========');
    } catch (error) {
      this.logger.error('查询预约结果失败', error);
    }
  }

  /**
   * 每天9:30-19:30每小时执行旅行任务
   */
  @Cron('0 30 9-19 * * *')
  async executeTravelTask() {
    this.logger.log('========== 开始执行旅行任务 ==========');
    try {
      // 获取启用自动旅行的账号
      const accounts = await this.mtAccountService.findTravelEnabled();
      this.logger.log(`待执行旅行账号数: ${accounts.length}`);

      for (const account of accounts) {
        try {
          // 开始旅行
          await this.mtApiService.startTravel(account.cookie, account.deviceId);
          this.logger.log(`旅行开始: ${account.mobile}`);

          // 领取奖励
          await this.delay(2000);
          await this.mtApiService.receiveReward(
            account.cookie,
            account.deviceId,
            account.lat,
            account.lng,
          );

          await this.delay(3000);
        } catch (error) {
          this.logger.error(`账号${account.mobile}旅行失败`, error.message);
        }
      }

      this.logger.log('========== 旅行任务执行完成 ==========');
    } catch (error) {
      this.logger.error('旅行任务执行失败', error);
    }
  }

  /**
   * 每天7:00检查即将过期的Token
   */
  @Cron('0 0 7 * * *')
  async checkTokenExpire() {
    this.logger.log('========== 检查Token过期 ==========');
    try {
      // 获取3天内即将过期的账号
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 3);

      const accounts = await this.prisma.mtAccount.findMany({
        where: {
          status: 1,
          tokenExpireAt: { lte: expireDate },
        },
      });

      for (const account of accounts) {
        const user = await this.prisma.user.findFirst({
          where: { accounts: { some: { id: account.id } } },
        });

        if (user) {
          await this.wechatService.sendTokenExpireNotify({
            userId: user.id,
            mobile: account.mobile,
            expireDate: account.tokenExpireAt?.toISOString().split('T')[0] || '',
          });

          this.logger.log(`Token即将过期提醒: ${account.mobile}`);
        }
      }

      this.logger.log('========== Token过期检查完成 ==========');
    } catch (error) {
      this.logger.error('Token过期检查失败', error);
    }
  }

  /**
   * 为单个账号执行预约
   */
  private async reserveForAccount(account: any) {
    this.logger.log(`开始预约: ${account.mobile}`);

    // 检查必要信息
    if (!account.token || !account.provinceName || !account.lat) {
      this.logger.warn(`账号${account.mobile}信息不完整，跳过`);
      return;
    }

    const itemCodes = account.config?.itemCodes?.split('@') || [];
    if (itemCodes.length === 0) {
      this.logger.warn(`账号${account.mobile}未配置预约商品，跳过`);
      return;
    }

    for (const itemId of itemCodes) {
      try {
        // 执行预约
        const log = await this.reservationService.reserve(account, itemId);
        this.logger.log(`预约结果: ${account.mobile} - ${itemId} - 状态:${log.status}`);

        // 延迟
        await this.delay(3000 + Math.random() * 2000);
      } catch (error) {
        this.logger.error(`账号${account.mobile}预约${itemId}失败`, error.message);
      }
    }

    // 预约后领取耐力值
    try {
      await this.delay(10000);
      await this.mtApiService.getEnergyAward(
        account.cookie,
        account.deviceId,
        account.lat,
        account.lng,
      );
      this.logger.log(`领取耐力值: ${account.mobile}`);
    } catch (error) {
      this.logger.error(`账号${account.mobile}领取耐力值失败`, error.message);
    }

    // 发送预约结果通知
    try {
      const user = await this.prisma.user.findFirst({
        where: { accounts: { some: { id: account.id } } },
      });

      if (user) {
        await this.wechatService.sendReserveResultNotify({
          userId: user.id,
          itemName: `${itemCodes.length}个商品`,
          reserveTime: new Date().toLocaleString('zh-CN'),
          status: '已提交',
          remark: '请在18:00后查看结果',
        });
      }
    } catch (error) {
      this.logger.error('发送预约通知失败', error.message);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
