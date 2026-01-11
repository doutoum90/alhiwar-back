import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { User } from '../entities/user.entity';
import { Article } from '../entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,      // This provides UserRepository
      Article,   // This provides ArticleRepository - THIS WAS MISSING
    ]),
  ],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService], // Export if used in other modules
})
export class AuthorsModule { }