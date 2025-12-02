import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MtApiService } from '../mt-api/mt-api.service';
import { MtCrypto } from '../../common/utils/crypto.util';
import { MtAccount, ReservationConfig } from '@prisma/client';

@Injectable()
export class MtAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mtApiService: MtApiService,
  ) {}

  /**
   * 发送验证码
   */
  async sendCode(userId: bigint, mobile: string): Promise<boolean> {
    // 检查账号是否已存在
    const existing = await this.prisma.mtAccount.findFirst({
      where: { userId, mobile },
    });

    // 生成或使用已有的deviceId
    const deviceId = existing?.deviceId || MtCrypto.generateDeviceId();

    // 调用i茅台API发送验证码
    const success = await this.mtApiService.sendCode(mobile, deviceId);

    if (!success) {
      throw new BadRequestException('发送验证码失败');
    }

    return true;
  }

  /**
   * 登录i茅台
   */
  async login(userId: bigint, mobile: string, code: string): Promise<MtAccount> {
    // 检查账号是否已存在
    let account = await this.prisma.mtAccount.findFirst({
      where: { userId, mobile },
    });

    const deviceId = account?.deviceId || MtCrypto.generateDeviceId();

    // 调用i茅台API登录
    const loginResult = await this.mtApiService.login(mobile, code, deviceId);

    // Token过期时间（30天后）
    const tokenExpireAt = new Date();
    tokenExpireAt.setDate(tokenExpireAt.getDate() + 30);

    if (account) {
      // 更新已有账号
      account = await this.prisma.mtAccount.update({
        where: { id: account.id },
        data: {
          mtUserId: loginResult.userId?.toString(),
          token: loginResult.token,
          cookie: loginResult.cookie,
          deviceId,
          status: 1,
          tokenExpireAt,
        },
      });
    } else {
      // 创建新账号
      account = await this.prisma.mtAccount.create({
        data: {
          userId,
          mobile,
          mtUserId: loginResult.userId?.toString(),
          token: loginResult.token,
          cookie: loginResult.cookie,
          deviceId,
          status: 1,
          tokenExpireAt,
        },
      });

      // 创建默认预约配置
      await this.prisma.reservationConfig.create({
        data: {
          accountId: account.id,
          itemCodes: '2478', // 默认贵州茅台酒（珍品）
          shopType: 1,
          reserveMinute: 9,
          randomMinute: 0,
          autoTravel: 1,
          isEnabled: 1,
        },
      });
    }

    return account;
  }

  /**
   * 获取用户的所有账号
   */
  async findByUserId(userId: bigint): Promise<MtAccount[]> {
    return this.prisma.mtAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取账号详情
   */
  async findById(id: bigint, userId: bigint): Promise<MtAccount> {
    const account = await this.prisma.mtAccount.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('账号不存在');
    }

    return account;
  }

  /**
   * 删除账号
   */
  async delete(id: bigint, userId: bigint): Promise<void> {
    const account = await this.findById(id, userId);

    // 删除关联的配置和日志
    await this.prisma.reservationConfig.deleteMany({
      where: { accountId: account.id },
    });
    await this.prisma.reservationLog.deleteMany({
      where: { accountId: account.id },
    });
    await this.prisma.mtAccount.delete({
      where: { id: account.id },
    });
  }

  /**
   * 更新账号位置信息
   */
  async updateLocation(
    id: bigint,
    userId: bigint,
    data: {
      provinceName: string;
      cityName: string;
      lat: string;
      lng: string;
      address?: string;
    },
  ): Promise<MtAccount> {
    await this.findById(id, userId);

    return this.prisma.mtAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * 获取预约配置
   */
  async getConfig(accountId: bigint, userId: bigint): Promise<ReservationConfig> {
    await this.findById(accountId, userId);

    let config = await this.prisma.reservationConfig.findUnique({
      where: { accountId },
    });

    if (!config) {
      config = await this.prisma.reservationConfig.create({
        data: {
          accountId,
          itemCodes: '2478',
          shopType: 1,
          reserveMinute: 9,
          randomMinute: 0,
          autoTravel: 1,
          isEnabled: 1,
        },
      });
    }

    return config;
  }

  /**
   * 更新预约配置
   */
  async updateConfig(
    accountId: bigint,
    userId: bigint,
    data: {
      itemCodes?: string;
      shopType?: number;
      reserveMinute?: number;
      randomMinute?: number;
      autoTravel?: number;
      isEnabled?: number;
    },
  ): Promise<ReservationConfig> {
    await this.findById(accountId, userId);

    return this.prisma.reservationConfig.upsert({
      where: { accountId },
      update: data,
      create: {
        accountId,
        ...data,
      },
    });
  }

  /**
   * 获取当前分钟需要预约的账号
   */
  async findByReserveMinute(minute: number): Promise<any[]> {
    return this.prisma.mtAccount.findMany({
      where: {
        status: 1,
        token: { not: null },
        config: {
          isEnabled: 1,
          reserveMinute: minute,
        },
      },
      include: {
        config: true,
      },
    });
  }

  /**
   * 获取所有启用的账号
   */
  async findAllEnabled(): Promise<any[]> {
    return this.prisma.mtAccount.findMany({
      where: {
        status: 1,
        token: { not: null },
        config: {
          isEnabled: 1,
        },
      },
      include: {
        config: true,
      },
    });
  }

  /**
   * 获取启用自动旅行的账号
   */
  async findTravelEnabled(): Promise<any[]> {
    return this.prisma.mtAccount.findMany({
      where: {
        status: 1,
        token: { not: null },
        config: {
          isEnabled: 1,
          autoTravel: 1,
        },
      },
      include: {
        config: true,
      },
    });
  }
}
