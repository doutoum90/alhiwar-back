// src/database/seeds/04-ads.seeder.ts
import { AppDataSource } from "../data-source";
import { Ad, AdType, AdWorkflowStatus } from "../../entities/ad.entity";
import { User, UserRole } from "../../entities/user.entity";

type SeedAd = {
  title: string;
  content: string;
  image: string | null;
  link: string | null;
  type: AdType;
  status: AdWorkflowStatus;

  impressions: number;
  clicks: number;
  views: number;
  totalRevenue: number;

  startDate: Date | null;
  endDate: Date | null;

  createdById: string | null;
  submittedAt: Date | null;
  submittedById: string | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
  reviewComment: string | null;
};

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (base: Date, months: number) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};

const ctr = (clicks: number, impressions: number) =>
  impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

export class AdsSeeder {
  public static async run(): Promise<void> {
    console.log("🔄 Seeding ads (workflow + coherence)...");

    const repo = AppDataSource.getRepository(Ad);
    const userRepo = AppDataSource.getRepository(User);

    const now = new Date();

    const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } as any });
    const editor = await userRepo.findOne({ where: { role: UserRole.EDITOR_IN_CHIEF } as any });
    const author = await userRepo.findOne({ where: { role: UserRole.AUTHOR } as any });
    const journalist = await userRepo.findOne({ where: { role: UserRole.JOURNALIST } as any });

    const creator = author?.id ?? journalist?.id ?? null;
    const reviewer = editor?.id ?? admin?.id ?? null;

    const activeStart = addDays(now, -7);
    const activeEnd = addMonths(now, 6);

    const futureStart = addDays(now, 10);
    const futureEnd = addMonths(now, 2);

    const expiredStart = addMonths(now, -12);
    const expiredEnd = addDays(now, -30);

    const ads: SeedAd[] = [
      // ✅ PUBLISHED active (date window OK)
      {
        title: "Premium Web Development Bootcamp",
        content: "Learn React, Node.js and TypeScript with real projects. Certification included.",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=350&fit=crop",
        link: "https://example.com/bootcamp",
        type: AdType.BANNER,
        status: AdWorkflowStatus.PUBLISHED,
        impressions: 18000,
        clicks: 360,
        views: 15000,
        totalRevenue: 1850.5,
        startDate: activeStart,
        endDate: activeEnd,
        createdById: creator,
        submittedAt: addDays(now, -8),
        submittedById: creator,
        reviewedAt: addDays(now, -7),
        reviewedById: reviewer,
        reviewComment: "Approved",
      },

      // ✅ PUBLISHED scheduled (future start)
      {
        title: "Tech Conference 2026",
        content: "Join the biggest tech conference. Talks, workshops, networking.",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=350&fit=crop",
        link: "https://example.com/conference",
        type: AdType.INLINE,
        status: AdWorkflowStatus.PUBLISHED,
        impressions: 0,
        clicks: 0,
        views: 0,
        totalRevenue: 0,
        startDate: futureStart,
        endDate: futureEnd,
        createdById: creator,
        submittedAt: addDays(now, -2),
        submittedById: creator,
        reviewedAt: addDays(now, -1),
        reviewedById: reviewer,
        reviewComment: "Approved (scheduled)",
      },

      // ✅ IN_REVIEW
      {
        title: "Cloud Hosting (Pending Review)",
        content: "High performance cloud hosting with 24/7 support.",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&h=350&fit=crop",
        link: "https://example.com/cloud",
        type: AdType.SIDEBAR,
        status: AdWorkflowStatus.IN_REVIEW,
        impressions: 0,
        clicks: 0,
        views: 0,
        totalRevenue: 0,
        startDate: activeStart,
        endDate: addMonths(now, 3),
        createdById: creator,
        submittedAt: addDays(now, -1),
        submittedById: creator,
        reviewedAt: null,
        reviewedById: null,
        reviewComment: null,
      },

      // ✅ REJECTED
      {
        title: "Rejected Ad (Bad Landing Page)",
        content: "This ad is rejected for testing purposes.",
        image: "https://images.unsplash.com/photo-1586892478025-2b5472316f22?w=900&h=350&fit=crop",
        link: "https://example.com/rejected",
        type: AdType.POPUP,
        status: AdWorkflowStatus.REJECTED,
        impressions: 0,
        clicks: 0,
        views: 0,
        totalRevenue: 0,
        startDate: activeStart,
        endDate: addMonths(now, 1),
        createdById: creator,
        submittedAt: addDays(now, -6),
        submittedById: creator,
        reviewedAt: addDays(now, -5),
        reviewedById: reviewer,
        reviewComment: "Rejected: landing page not compliant.",
      },

      // ✅ DRAFT
      {
        title: "Draft Ad (Not Submitted)",
        content: "Draft ad content for testing draft state.",
        image: null,
        link: null,
        type: AdType.BANNER,
        status: AdWorkflowStatus.DRAFT,
        impressions: 0,
        clicks: 0,
        views: 0,
        totalRevenue: 0,
        startDate: null,
        endDate: null,
        createdById: creator,
        submittedAt: null,
        submittedById: null,
        reviewedAt: null,
        reviewedById: null,
        reviewComment: null,
      },

      // ✅ ARCHIVED (expired)
      {
        title: "Archived Ad (Expired Campaign)",
        content: "Archived ad for testing archive and expired dates.",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&h=350&fit=crop",
        link: "https://example.com/archived",
        type: AdType.SIDEBAR,
        status: AdWorkflowStatus.ARCHIVED,
        impressions: 52000,
        clicks: 1240,
        views: 45600,
        totalRevenue: 3250.9,
        startDate: expiredStart,
        endDate: expiredEnd,
        createdById: creator,
        submittedAt: addMonths(now, -13),
        submittedById: creator,
        reviewedAt: addMonths(now, -12),
        reviewedById: reviewer,
        reviewComment: "Campaign ended; archived for history.",
      },
    ];

    let created = 0;
    let updated = 0;

    for (const data of ads) {
      const existing = await repo.findOne({ where: { title: data.title } as any });

      const computedCtr = ctr(data.clicks, data.impressions);

      if (!existing) {
        const ad = new Ad();
        ad.title = data.title;
        ad.content = data.content;
        ad.image = data.image;
        ad.link = data.link;

        ad.type = data.type;
        ad.status = data.status;

        ad.impressions = data.impressions;
        ad.clicks = data.clicks;
        ad.views = data.views;
        ad.clickThroughRate = computedCtr as any;
        ad.totalRevenue = data.totalRevenue as any;

        ad.startDate = data.startDate;
        ad.endDate = data.endDate;

        ad.createdById = data.createdById;
        ad.submittedAt = data.submittedAt;
        ad.submittedById = data.submittedById;
        ad.reviewedAt = data.reviewedAt;
        ad.reviewedById = data.reviewedById;
        ad.reviewComment = data.reviewComment;

        await repo.save(ad);
        created++;
        console.log(`  ✅ Created: ${data.title} (${data.status})`);
      } else {
        existing.content = data.content;
        existing.image = data.image;
        existing.link = data.link;

        existing.type = data.type;
        existing.status = data.status;

        existing.impressions = data.impressions;
        existing.clicks = data.clicks;
        existing.views = data.views;
        existing.clickThroughRate = computedCtr as any;
        existing.totalRevenue = data.totalRevenue as any;

        existing.startDate = data.startDate;
        existing.endDate = data.endDate;

        existing.createdById = data.createdById;
        existing.submittedAt = data.submittedAt;
        existing.submittedById = data.submittedById;
        existing.reviewedAt = data.reviewedAt;
        existing.reviewedById = data.reviewedById;
        existing.reviewComment = data.reviewComment;

        await repo.save(existing);
        updated++;
        console.log(`  🔁 Updated: ${data.title} (${data.status})`);
      }
    }

    console.log(`📊 Ads: ${created} created, ${updated} updated\n`);
  }
}
