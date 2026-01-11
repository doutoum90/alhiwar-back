import { AppDataSource } from "../data-source";
import { NewsletterSubscription } from "../../entities/newsletter_subscription.entity";
import { randomHex } from "./utils/crypto";

export class NewsletterSeeder {
  public static async run(): Promise<void> {
    console.log("📰 Seeding newsletter subscriptions...");

    const repo = AppDataSource.getRepository(NewsletterSubscription);
    const now = new Date();

    const rows: Array<Partial<NewsletterSubscription>> = [
      {
        email: "sub1@blog-alhiwar.com",
        isActive: true,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
        unsubscribeToken: randomHex(16),
      },
      {
        email: "sub2@blog-alhiwar.com",
        isActive: true,
        isVerified: false,
        verifyToken: randomHex(16),
        verifyTokenExpiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 12),
        unsubscribeToken: randomHex(16),
      },
      {
        email: "sub3@blog-alhiwar.com",
        isActive: false,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
        unsubscribeToken: randomHex(16),
      },
      {
        email: "sub4@blog-alhiwar.com",
        isActive: false,
        isVerified: false,
        verifyToken: randomHex(16),
        verifyTokenExpiresAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        unsubscribeToken: randomHex(16),
      },
    ];

    let created = 0;
    let updated = 0;

    for (const r of rows) {
      const email = String(r.email || "").toLowerCase().trim();
      const existing = await repo.findOne({ where: { email } as any });

      if (!existing) {
        await repo.save(repo.create({ ...r, email } as any));
        created++;
      } else {
        existing.isActive = r.isActive ?? existing.isActive;
        existing.isVerified = r.isVerified ?? existing.isVerified;

        existing.unsubscribeToken = existing.unsubscribeToken ?? (r.unsubscribeToken ?? randomHex(16));
        existing.verifyToken = existing.verifyToken ?? (r.verifyToken ?? null);
        existing.verifyTokenExpiresAt = existing.verifyTokenExpiresAt ?? (r.verifyTokenExpiresAt ?? null);

        await repo.save(existing);
        updated++;
      }
    }

    console.log(`✅ Newsletter: ${created} created, ${updated} updated\n`);
  }
}
