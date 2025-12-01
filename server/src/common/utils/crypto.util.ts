import * as crypto from 'crypto';

/**
 * i茅台加密工具类
 */
export class MtCrypto {
  // MD5签名盐值
  private static readonly SALT = '2af72f100c356273d46284f6fd1dfc08';

  // AES加密配置
  private static readonly AES_KEY = 'qbhajinldepmucsonaaaccgypwuvcjaa';
  private static readonly AES_IV = '2018534749963515';

  /**
   * MD5签名
   * @param content 签名内容
   * @param timestamp 时间戳
   */
  static signature(content: string, timestamp: number): string {
    const text = `${this.SALT}${content}${timestamp}`;
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * 发送验证码签名
   * @param mobile 手机号
   * @param timestamp 时间戳
   */
  static signSendCode(mobile: string, timestamp: number): string {
    return this.signature(mobile, timestamp);
  }

  /**
   * 登录签名
   * @param mobile 手机号
   * @param code 验证码
   * @param timestamp 时间戳
   */
  static signLogin(mobile: string, code: string, timestamp: number): string {
    return this.signature(`${mobile}${code}`, timestamp);
  }

  /**
   * AES-CBC加密
   * @param data 待加密数据
   */
  static aesEncrypt(data: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_KEY),
      Buffer.from(this.AES_IV)
    );
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * AES-CBC解密
   * @param data 待解密数据
   */
  static aesDecrypt(data: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_KEY),
      Buffer.from(this.AES_IV)
    );
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 生成设备ID
   */
  static generateDeviceId(): string {
    return crypto.randomUUID().toLowerCase();
  }
}
