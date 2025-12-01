import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserService } from '../user/user.service';

interface WxSession {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  /**
   * 微信小程序登录
   */
  async wxLogin(code: string): Promise<{ token: string; user: any }> {
    // 1. 用code换取openid
    const session = await this.code2Session(code);

    if (session.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${session.errmsg}`);
    }

    // 2. 查找或创建用户
    let user = await this.userService.findByOpenid(session.openid);

    if (!user) {
      user = await this.userService.create({
        openid: session.openid,
        unionid: session.unionid,
      });
    }

    // 3. 生成JWT Token
    const payload = {
      sub: user.id.toString(),
      openid: user.openid,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id.toString(),
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * 微信code换取session
   */
  private async code2Session(code: string): Promise<WxSession> {
    const appid = this.configService.get<string>('WX_APPID');
    const secret = this.configService.get<string>('WX_SECRET');

    const url = `https://api.weixin.qq.com/sns/jscode2session`;
    const response = await axios.get(url, {
      params: {
        appid,
        secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    return response.data;
  }

  /**
   * 验证Token
   */
  async validateToken(payload: any): Promise<any> {
    const user = await this.userService.findById(BigInt(payload.sub));
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}
