import { Module } from '@nestjs/common';
import { VillaController } from './villa.controller';
import { VillaService } from './villa.service';

@Module({
  controllers: [VillaController],
  providers: [VillaService],
  exports: [VillaService],
})
export class VillaModule {}
