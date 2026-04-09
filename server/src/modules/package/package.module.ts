import { Module } from '@nestjs/common';
import { PackageController } from './package.controller';
import { AdminPackageController } from './admin-package.controller';
import { PackageService } from './package.service';

@Module({
  controllers: [PackageController, AdminPackageController],
  providers: [PackageService],
})
export class PackageModule {}
