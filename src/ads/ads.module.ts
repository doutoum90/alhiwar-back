import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { Ad } from '../entities/ad.entity';
import { AdPlacement } from '../entities/ad-placement.entity';
import { AdPlacementsController } from './ad-placements.controller';
import { AdPlacementsService } from './ad-placements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ad, AdPlacement])],
  controllers: [AdsController, AdPlacementsController],
  providers: [AdsService, AdPlacementsService],
  exports: [AdsService, AdPlacementsService],
})
export class AdsModule { }
