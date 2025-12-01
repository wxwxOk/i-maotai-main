import { Module } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { MtApiModule } from '../mt-api/mt-api.module';
import { MtAccountModule } from '../mt-account/mt-account.module';

@Module({
  imports: [MtApiModule, MtAccountModule],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
