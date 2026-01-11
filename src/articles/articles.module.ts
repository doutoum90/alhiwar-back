import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { ArticleComment } from '../entities/article-comment.entity';
import { ArticleLike } from '../entities/article-like.entity';
import { ArticleMedia } from '../entities/article-media.entity';
import { User } from '../entities/user.entity';
import { ArticleAuthorsService } from './article-authors.service';
import { ArticleCommentsService } from './article-comments.service';
import { ArticleLikesService } from './article-likes.service';
import { ArticleMediaService } from './article-media.service';
import { ArticleAuthor } from '../entities/article-author.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
     Article,
      Category,
      ArticleMedia,
      ArticleLike,
      ArticleComment,
      ArticleAuthor,
      User,
    ])],
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    ArticleMediaService,
    ArticleLikesService,
    ArticleCommentsService,
    ArticleAuthorsService,
  ],
})
export class ArticlesModule {}