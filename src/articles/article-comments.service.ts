import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Article } from "../entities/article.entity";
import { ArticleComment } from "../entities/article-comment.entity";
import { CreateCommentDto, CreatePublicCommentDto } from "./dto/comments.dto";

type CommentStatus = "visible" | "pending" | "hidden";

@Injectable()
export class ArticleCommentsService {
  constructor(
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(ArticleComment) private readonly commentRepo: Repository<ArticleComment>,
  ) {}

  async add(articleId: string, userId: string, dto: CreateCommentDto) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const comment = this.commentRepo.create({
      articleId,
      userId,
      content: dto.content,
      status: "visible",
      isHidden: false,
      guestName: null,
      guestEmail: null,
    });

    const saved = await this.commentRepo.save(comment);
    await this.articleRepo.increment({ id: articleId }, "commentsCount", 1);
    return saved;
  }

  async addPublic(articleId: string, dto: CreatePublicCommentDto) {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException("Article introuvable");

    const content = (dto.content ?? "").trim();
    if (!content) throw new ForbiddenException("Contenu vide");

    const comment = this.commentRepo.create({
      articleId,
      userId: null,
      content,
      guestName: (dto.name ?? "").trim() || null,
      guestEmail: (dto.email ?? "").trim() || null,
      status: "pending",
      isHidden: false,
    });

    const saved = await this.commentRepo.save(comment);
    await this.articleRepo.increment({ id: articleId }, "commentsCount", 1);
    return saved;
  }

  async list(articleId: string, opts: { page: number; limit: number; status?: CommentStatus } = { page: 1, limit: 20 }) {
    const page = Math.max(1, Number(opts.page || 1));
    const limit = Math.min(100, Math.max(1, Number(opts.limit || 20)));
    const status = opts.status;

    const where: any = { articleId };

    if (!status || status === "visible") {
      where.status = "visible";
      where.isHidden = false;
    } else if (status === "hidden") {
      where.status = "hidden";
      where.isHidden = true;
    } else if (status === "pending") {
      where.status = "pending";
    }

    const [items, total] = await this.commentRepo.findAndCount({
      where,
      relations: ["user"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async listPublic(articleId: string, opts: { page: number; limit: number } = { page: 1, limit: 20 }) {
    const page = Math.max(1, Number(opts.page || 1));
    const limit = Math.min(100, Math.max(1, Number(opts.limit || 20)));

    const [items, total] = await this.commentRepo.findAndCount({
      where: { articleId, isHidden: false, status: "visible" as CommentStatus },
      relations: ["user"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async moderate(commentId: string, status: CommentStatus) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException("Commentaire introuvable");

    comment.status = status;
    comment.isHidden = status === "hidden";

    return this.commentRepo.save(comment);
  }

  async remove(commentId: string, userId: string, isAdmin = false) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException("Commentaire introuvable");

    if (!isAdmin && comment.userId !== userId) {
      throw new ForbiddenException("Non autorisé");
    }

    await this.commentRepo.remove(comment);
    await this.articleRepo.decrement({ id: comment.articleId }, "commentsCount", 1);
    return { ok: true };
  }
}
