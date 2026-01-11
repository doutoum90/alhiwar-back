import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { Ad } from '../entities/ad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ad])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService], // Export pour utilisation dans d'autres modules
})
export class AdsModule { }