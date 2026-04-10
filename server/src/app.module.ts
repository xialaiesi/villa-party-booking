import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { CosModule } from './common/cos/cos.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { VillaModule } from './modules/villa/villa.module';
import { OrderModule } from './modules/order/order.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { ActivityPlanModule } from './modules/activity-plan/activity-plan.module';
import { OrderShareModule } from './modules/order-share/order-share.module';
import { AlbumModule } from './modules/album/album.module';
import { SmartRecommendModule } from './modules/smart-recommend/smart-recommend.module';
import { ThemePackModule } from './modules/theme-pack/theme-pack.module';
import { GroupBuyModule } from './modules/group-buy/group-buy.module';
import { OrderTaskModule } from './modules/order-task/order-task.module';
import { LocalServiceModule } from './modules/local-service/local-service.module';
import { CommunityModule } from './modules/community/community.module';
import { CorporateModule } from './modules/corporate/corporate.module';
import { SeasonalEventModule } from './modules/seasonal-event/seasonal-event.module';
import { AiPlannerModule } from './modules/ai-planner/ai-planner.module';
import { PackageModule } from './modules/package/package.module';
import { FacilityModule } from './modules/facility/facility.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { HomeModule } from './modules/home/home.module';
import { MessageModule } from './modules/message/message.module';
import { ImportModule } from './modules/import/import.module';
import { UploadModule } from './modules/upload/upload.module';
import { SiteConfigModule } from './modules/site-config/site-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    CosModule,
    AuthModule,
    VillaModule,
    OrderModule,
    AdminModule,
    AiModule,
    ActivityPlanModule,
    OrderShareModule,
    AlbumModule,
    SmartRecommendModule,
    ThemePackModule,
    GroupBuyModule,
    OrderTaskModule,
    LocalServiceModule,
    CommunityModule,
    CorporateModule,
    SeasonalEventModule,
    AiPlannerModule,
    PackageModule,
    FacilityModule,
    MerchantModule,
    HomeModule,
    MessageModule,
    ImportModule,
    UploadModule,
    SiteConfigModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
