import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UpdateAuthorsDto } from "./dto/authors.dto";
import { ArticleAuthor } from "../entities/article-author.entity";
import { Article } from "../entities/article.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class ArticleAuthorsService {
  constructor(
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ArticleAuthor) private readonly articleAuthorRepo: Repository<ArticleAuthor>,
  ) { }

  async setAuthors(articleId: string, dto: UpdateAuthorsDto) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const users = await this.userRepo.find({ where: { id: In(dto.authorIds) } });
    if (users.length !== dto.authorIds.length) throw new NotFoundException("Auteur(s) introuvable(s)");

    await this.articleAuthorRepo.delete({ articleId });

    const links = dto.authorIds.map((userId, idx) =>
      this.articleAuthorRepo.create({
        articleId,
        userId,
        isMain: idx === 0,
      }),
    );

    await this.articleAuthorRepo.save(links);

    return this.articleRepo.findOne({
      where: { id: articleId },
      relations: ["authors", "authors.user"],
    });
  }

  async getAuthors(articleId: string) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
      relations: ["authors", "authors.user"],
    });
    if (!article) throw new NotFoundException("Article introuvable");
    return article.authors ?? [];
  }

  async setMainAuthor(articleId: string, userId: string) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("Auteur introuvable");

    article.authorId = userId;
    await this.articleRepo.save(article);

    await this.articleAuthorRepo.update({ articleId }, { isMain: false });

    const existing = await this.articleAuthorRepo.findOne({ where: { articleId, userId } });
    if (!existing) {
      await this.articleAuthorRepo.save(
        this.articleAuthorRepo.create({ articleId, userId, isMain: true }),
      );
    } else {
      existing.isMain = true;
      await this.articleAuthorRepo.save(existing);
    }

    return this.articleRepo.findOne({
      where: { id: articleId },
      relations: ["author", "authors", "authors.user", "category"],
    });
  }

}
