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

    // 1) supprimer les anciens liens
    await this.articleAuthorRepo.delete({ articleId });

    // 2) recréer les liens (option: premier = isMain)
    const links = dto.authorIds.map((userId, idx) =>
      this.articleAuthorRepo.create({
        articleId,
        userId,
        isMain: idx === 0,
      }),
    );

    await this.articleAuthorRepo.save(links);

    // 3) retourner l’article avec authors + user
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

  // src/articles/article-authors.service.ts
  async setMainAuthor(articleId: string, userId: string) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("Auteur introuvable");

    // 1) article.authorId (main)
    article.authorId = userId;
    await this.articleRepo.save(article);

    // 2) pivot : mettre un seul isMain=true
    await this.articleAuthorRepo.update({ articleId }, { isMain: false });

    // si le lien n'existe pas, on le crée
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
