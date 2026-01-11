import { AppDataSource } from "../data-source";
import { NewsletterSubscription } from "../../entities/newsletter_subscription.entity";
import { randomBytes } from "crypto";

const mkToken = (lenBytes = 24) => randomBytes(lenBytes).toString("hex"); // 48 chars

export class NewsletterSeeder {
  public static async run(): Promise<void> {
    console.log("📰 Seeding newsletter subscriptions...");

    const repo = AppDataSource.getRepository(NewsletterSubscription);
    const now = new Date();

    const rows: Array<Partial<NewsletterSubscription>> = [
      // ✅ vérifié + actif
      {
        email: "sub1@blog-alhiwar.com",
        isActive: true,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
        unsubscribeToken: mkToken(16),
      },
      // ✅ actif + non vérifié (token valide)
      {
        email: "sub2@blog-alhiwar.com",
        isActive: true,
        isVerified: false,
        verifyToken: mkToken(16),
        verifyTokenExpiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 12), // +12h
        unsubscribeToken: mkToken(16),
      },
      // ✅ inactif + vérifié (désinscrit)
      {
        email: "sub3@blog-alhiwar.com",
        isActive: false,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
        unsubscribeToken: mkToken(16),
      },
      // ✅ inactif + non vérifié (token expiré)
      {
        email: "sub4@blog-alhiwar.com",
        isActive: false,
        isVerified: false,
        verifyToken: mkToken(16),
        verifyTokenExpiresAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // -24h (expiré)
        unsubscribeToken: mkToken(16),
      },
    ];

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const r of rows) {
      const email = String(r.email || "").toLowerCase().trim();
      const existing = await repo.findOne({ where: { email } as any });

      if (!existing) {
        await repo.save(repo.create({ ...r, email } as any));
        created++;
      } else {
        // 🔁 on garde l'existant, mais on peut synchroniser quelques flags si tu veux
        existing.isActive = r.isActive ?? existing.isActive;
        existing.isVerified = r.isVerified ?? existing.isVerified;

        // tokens : si déjà présents, on ne casse pas
        existing.unsubscribeToken = existing.unsubscribeToken ?? (r.unsubscribeToken ?? mkToken(16));
        existing.verifyToken = existing.verifyToken ?? (r.verifyToken ?? null);
        existing.verifyTokenExpiresAt = existing.verifyTokenExpiresAt ?? (r.verifyTokenExpiresAt ?? null);

        await repo.save(existing);
        updated++;
      }
    }

    console.log(`✅ Newsletter: ${created} created, ${updated} updated, ${skipped} skipped\n`);
  }
}
