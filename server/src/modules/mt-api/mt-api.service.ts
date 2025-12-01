import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { MtCrypto } from '../../common/utils/crypto.util';

/**
 * i茅台API服务
 */
@Injectable()
export class MtApiService {
  private readonly logger = new Logger(MtApiService.name);
  private readonly http: AxiosInstance;
  private mtVersion: string = '1.8.6'; // 更新版本号（i茅台最低要求）

  // API基础URL
  private readonly BASE_URL = 'https://app.moutai519.com.cn';
  private readonly STATIC_URL = 'https://static.moutai519.com.cn';
  private readonly H5_URL = 'https://h5.moutai519.com.cn';

  constructor() {
    this.http = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'iOS;16.3;Apple;iPhone 14 Pro Max',
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'zh-Hans-CN;q=1',
      },
    });
    // 启动时获取最新版本号
    this.getMtVersion();
  }

  /**
   * 获取最新APP版本号
   */
  async getMtVersion(): Promise<string> {
    try {
      const url = 'https://apps.apple.com/cn/app/i%E8%8C%85%E5%8F%B0/id1600482450';
      const response = await axios.get(url);
      const match = response.data.match(/new__latest__version">(.*?)<\/p>/);
      if (match) {
        this.mtVersion = match[1].replace('版本 ', '');
      }
    } catch (error) {
      this.logger.warn('获取版本号失败，使用默认版本');
    }
    return this.mtVersion;
  }

  /**
   * 发送验证码
   */
  async sendCode(mobile: string, deviceId: string): Promise<boolean> {
    const timestamp = Date.now();
    const data = {
      mobile,
      md5: MtCrypto.signSendCode(mobile, timestamp),
      timestamp: String(timestamp),
    };

    this.logger.log(`发送验证码请求: mobile=${mobile}, deviceId=${deviceId}, version=${this.mtVersion}`);

    try {
      const response = await this.http.post(
        `${this.BASE_URL}/xhr/front/user/register/vcode`,
        data,
        {
          headers: {
            'MT-Lat': '28.499562',
            'MT-Lng': '102.182324',
            'MT-K': '1675213490331',
            'Host': 'app.moutai519.com.cn',
            'MT-User-Tag': '0',
            'MT-Network-Type': 'WIFI',
            'MT-Team-ID': '',
            'MT-Info': '028e7f96f6369cafe1d105579c5b9377',
            'MT-Device-ID': deviceId,
            'MT-Bundle-ID': 'com.moutai.mall',
            'MT-Request-ID': `${Date.now()}`,
            'MT-APP-Version': this.mtVersion,
            'MT-R': 'clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdw==',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
          },
        }
      );

      this.logger.log(`发送验证码响应: ${JSON.stringify(response.data)}`);
      return response.data.code === 2000;
    } catch (error: any) {
      // 处理i茅台返回的业务错误
      if (error.response) {
        const errData = error.response.data;
        this.logger.error(`发送验证码失败: status=${error.response.status}, data=${JSON.stringify(errData)}`);

        // 返回具体错误信息
        throw new Error(errData?.message || `发送验证码失败(${error.response.status})`);
      }
      throw error;
    }
  }

  /**
   * 登录
   */
  async login(mobile: string, code: string, deviceId: string): Promise<any> {
    const timestamp = Date.now();
    const data = {
      mobile,
      vCode: code,
      ydToken: '',
      ydLogId: '',
      md5: MtCrypto.signLogin(mobile, code, timestamp),
      timestamp: String(timestamp),
      'MT-APP-Version': this.mtVersion,
    };

    const response = await this.http.post(
      `${this.BASE_URL}/xhr/front/user/register/login`,
      data,
      {
        headers: {
          'MT-Lat': '28.499562',
          'MT-Lng': '102.182324',
          'MT-K': '1675213490331',
          'Host': 'app.moutai519.com.cn',
          'MT-User-Tag': '0',
          'MT-Network-Type': 'WIFI',
          'MT-Team-ID': '',
          'MT-Info': '028e7f96f6369cafe1d105579c5b9377',
          'MT-Device-ID': deviceId,
          'MT-Bundle-ID': 'com.moutai.mall',
          'MT-Request-ID': `${Date.now()}`,
          'MT-APP-Version': this.mtVersion,
          'MT-R': 'clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdw==',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
      }
    );

    if (response.data.code === 2000) {
      return response.data.data;
    }
    throw new Error(response.data.message || '登录失败');
  }

  /**
   * 获取当日场次ID
   */
  async getSessionId(): Promise<{ sessionId: string; itemList: any[] }> {
    const dayTime = new Date().setHours(0, 0, 0, 0);
    const url = `${this.STATIC_URL}/mt-backend/xhr/front/mall/index/session/get/${dayTime}`;

    const response = await this.http.get(url);
    if (response.data.code === '2000') {
      return {
        sessionId: response.data.data.sessionId,
        itemList: response.data.data.itemList,
      };
    }
    throw new Error('获取场次ID失败');
  }

  /**
   * 获取门店列表URL
   */
  async getShopListUrl(): Promise<string> {
    const url = `${this.STATIC_URL}/mt-backend/xhr/front/mall/resource/get`;
    const response = await this.http.get(url);
    return response.data.data.mtshops_pc.url;
  }

  /**
   * 获取门店列表
   */
  async getShopList(): Promise<any> {
    const shopUrl = await this.getShopListUrl();
    const response = await this.http.get(shopUrl);
    return response.data;
  }

  /**
   * 获取省市投放门店
   */
  async getShopsByProvince(
    sessionId: string,
    province: string,
    itemId: string
  ): Promise<any[]> {
    const dayTime = new Date().setHours(0, 0, 0, 0);
    const url = `${this.STATIC_URL}/mt-backend/xhr/front/mall/shop/list/slim/v3/${sessionId}/${province}/${itemId}/${dayTime}`;

    const response = await this.http.get(url);
    if (response.data.code === '2000') {
      return response.data.data.shops;
    }
    return [];
  }

  /**
   * 预约申购
   */
  async reserve(params: {
    userId: string;
    token: string;
    deviceId: string;
    itemId: string;
    shopId: string;
    sessionId: string;
    lat: string;
    lng: string;
  }): Promise<any> {
    const { userId, token, deviceId, itemId, shopId, sessionId, lat, lng } = params;

    const requestBody: any = {
      itemInfoList: [{ count: 1, itemId }],
      sessionId,
      userId,
      shopId,
    };

    // AES加密actParam
    requestBody.actParam = MtCrypto.aesEncrypt(JSON.stringify(requestBody));

    const response = await this.http.post(
      `${this.BASE_URL}/xhr/front/mall/reservation/add`,
      requestBody,
      {
        headers: {
          'MT-Lat': lat,
          'MT-Lng': lng,
          'MT-Token': token,
          'MT-Info': '028e7f96f6369cafe1d105579c5b9377',
          'MT-Device-ID': deviceId,
          'MT-APP-Version': this.mtVersion,
          'userId': userId,
        },
      }
    );

    return response.data;
  }

  /**
   * 查询预约结果
   */
  async queryReservationResult(token: string, deviceId: string): Promise<any> {
    const url = `${this.BASE_URL}/xhr/front/mall/reservation/list/pageOne/query`;

    const response = await this.http.get(url, {
      headers: {
        'MT-Device-ID': deviceId,
        'MT-APP-Version': this.mtVersion,
        'MT-Token': token,
      },
    });

    if (response.data.code === 2000) {
      return response.data.data.reservationItemVOS || [];
    }
    return [];
  }

  /**
   * 获取申购耐力值
   */
  async getEnergyAward(cookie: string, deviceId: string, lat: string, lng: string): Promise<any> {
    const url = `${this.H5_URL}/game/isolationPage/getUserEnergyAward`;

    const response = await this.http.post(url, {}, {
      headers: {
        'MT-Device-ID': deviceId,
        'MT-APP-Version': this.mtVersion,
        'MT-Lat': lat,
        'MT-Lng': lng,
        'Cookie': `MT-Token-Wap=${cookie};MT-Device-ID-Wap=${deviceId};`,
      },
    });

    return response.data;
  }

  /**
   * 开始旅行
   */
  async startTravel(cookie: string, deviceId: string): Promise<any> {
    const url = `${this.H5_URL}/game/xmTravel/startTravel`;

    const response = await this.http.post(url, {}, {
      headers: {
        'MT-Device-ID': deviceId,
        'MT-APP-Version': this.mtVersion,
        'Cookie': `MT-Token-Wap=${cookie};MT-Device-ID-Wap=${deviceId};`,
      },
    });

    return response.data;
  }

  /**
   * 领取旅行奖励
   */
  async receiveReward(cookie: string, deviceId: string, lat: string, lng: string): Promise<any> {
    const url = `${this.H5_URL}/game/xmTravel/receiveReward`;

    const response = await this.http.post(url, {}, {
      headers: {
        'MT-Device-ID': deviceId,
        'MT-APP-Version': this.mtVersion,
        'MT-Lat': lat,
        'MT-Lng': lng,
        'Cookie': `MT-Token-Wap=${cookie};MT-Device-ID-Wap=${deviceId};`,
      },
    });

    return response.data;
  }
}
