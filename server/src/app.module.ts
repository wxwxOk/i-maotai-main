import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MtAccountModule } from './modules/mt-account/mt-account.module';
import { MtApiModule } from './modules/mt-api/mt-api.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WechatModule } from './modules/wechat/wechat.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // 定时任务模块
    ScheduleModule.forRoot(),
    // Prisma数据库模块
    PrismaModule,
    // 业务模块
    AuthModule,
    UserModule,
    MtAccountModule,
    MtApiModule,
    ReservationModule,
    SchedulerModule,
    WechatModule,
  ],
})
export class AppModule {}
