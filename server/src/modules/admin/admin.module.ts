import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminVillaController } from './admin-villa.controller';
import { AdminOrderController } from './admin-order.controller';
import { AdminService } from './admin.service';
import { VillaModule } from '../villa/villa.module';

@Module({
  imports: [
    VillaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminVillaController,
    AdminOrderController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
