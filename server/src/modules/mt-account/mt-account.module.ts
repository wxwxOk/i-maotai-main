import { Module } from '@nestjs/common';
import { MtAccountController } from './mt-account.controller';
import { MtAccountService } from './mt-account.service';
import { MtApiModule } from '../mt-api/mt-api.module';

@Module({
  imports: [MtApiModule],
  controllers: [MtAccountController],
  providers: [MtAccountService],
  exports: [MtAccountService],
})
export class MtAccountModule {}
