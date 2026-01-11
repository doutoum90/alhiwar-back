import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Article } from "../entities/article.entity";
import { ArticleMedia } from "../entities/article-media.entity";
import { AddMediaDto, ReorderMediaDto } from "./dto/media.dto";

@Injectable()
export class ArticleMediaService {
  constructor(
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(ArticleMedia) private readonly mediaRepo: Repository<ArticleMedia>,
  ) { }

  async add(articleId: string, dto: AddMediaDto) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const media = this.mediaRepo.create({
      articleId,
      type: dto.type,
      url: dto.url,
      title: dto.title ?? null,
      position: dto.position ?? 0,
    });

    return this.mediaRepo.save(media);
  }

  async list(articleId: string) {
    return this.mediaRepo.find({
      where: { articleId },
      order: { position: "ASC", createdAt: "ASC" },
    });
  }

  async reorder(mediaId: string, dto: ReorderMediaDto) {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) throw new NotFoundException("Média introuvable");

    media.position = dto.position;
    return this.mediaRepo.save(media);
  }


  async remove(mediaId: string) {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) throw new NotFoundException("Média introuvable");
    await this.mediaRepo.remove(media);
    return { ok: true };
  }
}
