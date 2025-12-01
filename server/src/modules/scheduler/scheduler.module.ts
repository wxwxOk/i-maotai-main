import { Module } from '@nestjs/common';
import { ReserveTask } from './tasks/reserve.task';
import { MtApiModule } from '../mt-api/mt-api.module';
import { MtAccountModule } from '../mt-account/mt-account.module';
import { ReservationModule } from '../reservation/reservation.module';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [MtApiModule, MtAccountModule, ReservationModule, WechatModule],
  providers: [ReserveTask],
})
export class SchedulerModule {}
