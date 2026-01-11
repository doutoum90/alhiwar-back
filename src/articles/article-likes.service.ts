import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Article } from "../entities/article.entity";
import { ArticleLike } from "../entities/article-like.entity";

@Injectable()
export class ArticleLikesService {
  constructor(
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(ArticleLike) private readonly likeRepo: Repository<ArticleLike>,
  ) {}

  async toggle(articleId: string, userId: string) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const existing = await this.likeRepo.findOne({ where: { articleId, userId } });

    if (existing) {
      await this.likeRepo.remove(existing);
      await this.articleRepo.decrement({ id: articleId }, "likesCount", 1);
      return { liked: false };
    }

    const like = this.likeRepo.create({ articleId, userId });
    await this.likeRepo.save(like);
    await this.articleRepo.increment({ id: articleId }, "likesCount", 1);
    return { liked: true };
  }

  async isLiked(articleId: string, userId: string) {
    const existing = await this.likeRepo.findOne({ where: { articleId, userId } });
    return { liked: !!existing };
  }
}
