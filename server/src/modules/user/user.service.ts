import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根据openid查找用户
   */
  async findByOpenid(openid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { openid },
    });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 创建用户
   */
  async create(data: { openid: string; unionid?: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        openid: data.openid,
        unionid: data.unionid,
      },
    });
  }

  /**
   * 更新用户信息
   */
  async update(
    id: bigint,
    data: { nickname?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 获取用户详情（包含账号列表）
   */
  async getUserWithAccounts(id: bigint) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            id: true,
            mobile: true,
            provinceName: true,
            cityName: true,
            status: true,
            tokenExpireAt: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
