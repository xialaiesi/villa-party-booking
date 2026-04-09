import { Module } from '@nestjs/common';
import { ThemePackController } from './theme-pack.controller';
import { AdminThemePackController } from './admin-theme-pack.controller';
import { ThemePackService } from './theme-pack.service';

@Module({
  controllers: [ThemePackController, AdminThemePackController],
  providers: [ThemePackService],
})
export class ThemePackModule {}
