import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MtApiService } from '../mt-api/mt-api.service';
import { ReservationLog } from '@prisma/client';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mtApiService: MtApiService,
  ) {}

  /**
   * 获取可预约商品列表
   */
  async getItems() {
    try {
      const { itemList } = await this.mtApiService.getSessionId();

      // 更新商品表
      for (const item of itemList) {
        await this.prisma.item.upsert({
          where: { itemId: item.itemId },
          update: {
            title: item.title,
            content: item.content,
            pictureUrl: item.picture,
            price: item.price,
          },
          create: {
            itemId: item.itemId,
            title: item.title,
            content: item.content,
            pictureUrl: item.picture,
            price: item.price,
          },
        });
      }

      return itemList.map((item: any) => ({
        itemId: item.itemId,
        title: item.title,
        content: item.content,
        pictureUrl: item.picture,
        price: item.price,
      }));
    } catch (error) {
      this.logger.error('获取商品列表失败', error);
      // 返回缓存数据
      const items = await this.prisma.item.findMany();
      return items.map((item) => ({
        itemId: item.itemId,
        title: item.title,
        content: item.content,
        pictureUrl: item.pictureUrl,
        price: item.price?.toNumber(),
      }));
    }
  }

  /**
   * 执行预约
   */
  async reserve(account: any, itemId: string): Promise<ReservationLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 获取sessionId
      const { sessionId } = await this.mtApiService.getSessionId();

      // 获取门店ID
      const shopId = await this.getShopId(
        account,
        itemId,
        sessionId,
      );

      // 执行预约
      const result = await this.mtApiService.reserve({
        userId: account.mtUserId,
        token: account.token,
        deviceId: account.deviceId,
        itemId,
        shopId,
        sessionId,
        lat: account.lat,
        lng: account.lng,
      });

      // 获取商品信息
      const item = await this.prisma.item.findUnique({
        where: { itemId },
      });

      // 记录日志
      const log = await this.prisma.reservationLog.create({
        data: {
          accountId: account.id,
          itemId,
          itemName: item?.title || itemId,
          shopId,
          status: result.code === 2000 ? 1 : 2,
          resultMsg: JSON.stringify(result),
          reserveDate: today,
        },
      });

      return log;
    } catch (error) {
      // 记录失败日志
      const log = await this.prisma.reservationLog.create({
        data: {
          accountId: account.id,
          itemId,
          status: 2,
          resultMsg: error.message,
          reserveDate: today,
        },
      });

      this.logger.error(`预约失败: ${account.mobile} - ${itemId}`, error);
      return log;
    }
  }

  /**
   * 获取门店ID
   */
  private async getShopId(
    account: any,
    itemId: string,
    sessionId: string,
  ): Promise<string> {
    const shops = await this.mtApiService.getShopsByProvince(
      sessionId,
      account.provinceName,
      itemId,
    );

    if (!shops || shops.length === 0) {
      throw new Error('没有可用的门店');
    }

    const shopType = account.config?.shopType || 1;

    if (shopType === 1) {
      // 选择出货量最大的门店
      let maxShop = shops[0];
      for (const shop of shops) {
        const item = shop.items?.find((i: any) => i.itemId === itemId);
        const maxItem = maxShop.items?.find((i: any) => i.itemId === itemId);
        if (item && maxItem && item.inventory > maxItem.inventory) {
          maxShop = shop;
        }
      }
      return maxShop.shopId;
    } else {
      // 选择距离最近的门店（简化处理，返回第一个）
      return shops[0].shopId;
    }
  }

  /**
   * 获取预约日志
   */
  async getLogs(
    userId: bigint,
    params: {
      accountId?: string;
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { accountId, page = 1, pageSize = 20, startDate, endDate } = params;

    // 构建查询条件
    const where: any = {
      account: { userId },
    };

    if (accountId) {
      where.accountId = BigInt(accountId);
    }

    if (startDate || endDate) {
      where.reserveDate = {};
      if (startDate) {
        where.reserveDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reserveDate.lte = new Date(endDate);
      }
    }

    // 查询总数
    const total = await this.prisma.reservationLog.count({ where });

    // 查询列表
    const list = await this.prisma.reservationLog.findMany({
      where,
      include: {
        account: {
          select: { mobile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      total,
      page,
      pageSize,
      list: list.map((log) => ({
        id: log.id.toString(),
        accountId: log.accountId.toString(),
        mobile: log.account?.mobile,
        mobileMask: this.maskMobile(log.account?.mobile || ''),
        itemId: log.itemId,
        itemName: log.itemName,
        shopId: log.shopId,
        shopName: log.shopName,
        status: log.status,
        statusText: this.getStatusText(log.status),
        reserveDate: log.reserveDate,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * 获取今日预约状态
   */
  async getTodayStatus(userId: bigint) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取用户的所有账号
    const accounts = await this.prisma.mtAccount.findMany({
      where: { userId },
      include: {
        config: true,
      },
    });

    const result = [];

    for (const account of accounts) {
      // 获取今日的预约日志
      const logs = await this.prisma.reservationLog.findMany({
        where: {
          accountId: account.id,
          reserveDate: today,
        },
      });

      // 获取配置的商品
      const itemCodes = account.config?.itemCodes?.split('@') || [];
      const items = [];

      for (const itemId of itemCodes) {
        const item = await this.prisma.item.findUnique({
          where: { itemId },
        });

        const log = logs.find((l) => l.itemId === itemId);

        items.push({
          itemId,
          itemName: item?.title || itemId,
          pictureUrl: item?.pictureUrl,
          status: log?.status || 0,
          statusText: this.getStatusText(log?.status || 0),
        });
      }

      result.push({
        accountId: account.id.toString(),
        mobile: account.mobile,
        mobileMask: this.maskMobile(account.mobile),
        status: this.getAccountStatus(logs, itemCodes.length),
        statusText: this.getAccountStatusText(logs, itemCodes.length),
        shopName: logs[0]?.shopName || '',
        reserveTime: logs[0]?.createdAt,
        items,
      });
    }

    return { accounts: result };
  }

  /**
   * 手机号脱敏
   */
  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 11) return mobile;
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  /**
   * 获取状态文本
   */
  private getStatusText(status: number | null): string {
    const map: Record<number, string> = {
      0: '预约中',
      1: '已预约',
      2: '预约失败',
      3: '已中签',
      4: '未中签',
    };
    return map[status || 0] || '未知';
  }

  /**
   * 获取账号预约状态
   */
  private getAccountStatus(logs: any[], itemCount: number): string {
    if (logs.length === 0) return 'pending';
    if (logs.some((l) => l.status === 3)) return 'win';
    if (logs.every((l) => l.status === 1)) return 'success';
    if (logs.some((l) => l.status === 2)) return 'failed';
    return 'pending';
  }

  /**
   * 获取账号预约状态文本
   */
  private getAccountStatusText(logs: any[], itemCount: number): string {
    const status = this.getAccountStatus(logs, itemCount);
    const map: Record<string, string> = {
      pending: '待预约',
      success: '已预约',
      failed: '预约失败',
      win: '已中签',
    };
    return map[status] || '未知';
  }
}
