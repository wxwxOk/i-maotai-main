import { Module } from '@nestjs/common';
import { MtApiService } from './mt-api.service';

@Module({
  providers: [MtApiService],
  exports: [MtApiService],
})
export class MtApiModule {}
