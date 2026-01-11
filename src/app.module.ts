import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { AdsModule } from './ads/ads.module';

import { Logger } from '@nestjs/common';
import { AuthorsModule } from './authors/authors.module';
import { ContactModule } from './contact/contact.module';
import { SettingModule } from './setting/setting.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { RbacModule } from './rbac/rbac.module';

const logger = new Logger('AppModule');

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5434'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'alhiwar',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    AdsModule,
    AuthorsModule,
    ContactModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SettingModule,
    NewsletterModule,
    RbacModule,
  ],
  controllers: [],
})
export class AppModule {
  constructor() {
    logger.log(`DATABASE_URL dans AppModule: ${process.env.DATABASE_URL || 'non défini'}`);
  }
}
