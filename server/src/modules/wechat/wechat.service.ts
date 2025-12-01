import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private accessToken: string = '';
  private tokenExpireTime: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取access_token
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存的token是否有效
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const appid = this.configService.get<string>('WX_APPID');
    const secret = this.configService.get<string>('WX_SECRET');

    const url = `https://api.weixin.qq.com/cgi-bin/token`;
    const response = await axios.get(url, {
      params: {
        grant_type: 'client_credential',
        appid,
        secret,
      },
    });

    if (response.data.access_token) {
      this.accessToken = response.data.access_token;
      // 提前5分钟过期
      this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
      return this.accessToken;
    }

    throw new Error(`获取access_token失败: ${response.data.errmsg}`);
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(params: {
    openid: string;
    templateId: string;
    page?: string;
    data: Record<string, { value: string }>;
  }): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

      const response = await axios.post(url, {
        touser: params.openid,
        template_id: params.templateId,
        page: params.page || '',
        data: params.data,
        miniprogram_state: 'formal', // 正式版
      });

      if (response.data.errcode === 0) {
        this.logger.log(`订阅消息发送成功: ${params.openid}`);
        return true;
      }

      this.logger.error(`订阅消息发送失败: ${response.data.errmsg}`);
      return false;
    } catch (error) {
      this.logger.error('发送订阅消息异常', error);
      return false;
    }
  }

  /**
   * 发送预约结果通知
   */
  async sendReserveResultNotify(params: {
    userId: bigint;
    itemName: string;
    reserveTime: string;
    status: string;
    remark: string;
  }): Promise<boolean> {
    // 获取用户openid
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      this.logger.warn(`用户不存在: ${params.userId}`);
      return false;
    }

    const templateId = this.configService.get<string>('WX_TEMPLATE_RESERVE_RESULT');

    return this.sendSubscribeMessage({
      openid: user.openid,
      templateId,
      page: '/pages/logs/list',
      data: {
        thing1: { value: params.itemName },
        date2: { value: params.reserveTime },
        phrase3: { value: params.status },
        thing4: { value: params.remark },
      },
    });
  }

  /**
   * 发送中签通知
   */
  async sendWinNotify(params: {
    userId: bigint;
    itemName: string;
    shopName: string;
    payDeadline: string;
    pickupDeadline: string;
  }): Promise<boolean> {
    // 获取用户openid
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      this.logger.warn(`用户不存在: ${params.userId}`);
      return false;
    }

    const templateId = this.configService.get<string>('WX_TEMPLATE_WIN_NOTIFY');

    return this.sendSubscribeMessage({
      openid: user.openid,
      templateId,
      page: '/pages/index/index',
      data: {
        thing1: { value: params.itemName },
        thing2: { value: params.shopName.substring(0, 20) },
        date3: { value: params.payDeadline },
        date4: { value: params.pickupDeadline },
      },
    });
  }

  /**
   * 发送Token过期提醒
   */
  async sendTokenExpireNotify(params: {
    userId: bigint;
    mobile: string;
    expireDate: string;
  }): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) return false;

    // 使用预约结果模板发送提醒
    const templateId = this.configService.get<string>('WX_TEMPLATE_RESERVE_RESULT');

    return this.sendSubscribeMessage({
      openid: user.openid,
      templateId,
      page: '/pages/accounts/list',
      data: {
        thing1: { value: `账号${params.mobile.slice(-4)}` },
        date2: { value: params.expireDate },
        phrase3: { value: '即将过期' },
        thing4: { value: '请及时重新登录' },
      },
    });
  }
}
