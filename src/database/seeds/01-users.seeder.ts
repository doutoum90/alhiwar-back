// src/database/seeds/01-users.seeder.ts
import { AppDataSource } from "../data-source";
import { User, UserRole, UserStatus, UserWorkflowStatus } from "../../entities/user.entity";
import * as bcrypt from "bcrypt";

type SeedUser = {
  name: string;
  email: string;
  passwordPlain: string;
  role: UserRole;
  username: string;
  status: UserStatus;
  avatar: string;
  workflowStatus: UserWorkflowStatus;
  isActive: boolean;
  isRejected?: boolean;
  reviewComment?: string | null;
};

const mkAvatar = (name: string, bg = "2563eb") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=ffffff&size=200`;

export class UsersSeeder {
  public static async run(): Promise<void> {
    console.log("🔄 Seeding users (workflow coverage)...");

    const repo = AppDataSource.getRepository(User);

    const P_ADMIN = "Admin@2026!";
    const P_EDITOR = "Editor@2026!";
    const P_JOURNALIST = "Journalist@2026!";
    const P_AUTHOR = "Author@2026!";
    const P_USER = "User@2026!";

    const usersData: SeedUser[] = [
      // Admins (published)
      {
        name: "Admin One",
        email: "admin1@blog-alhiwar.com",
        passwordPlain: P_ADMIN,
        role: UserRole.ADMIN,
        username: "admin1",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Admin One", "dc2626"),
        workflowStatus: UserWorkflowStatus.PUBLISHED,
        isActive: true,
      },
      {
        name: "Admin Two",
        email: "admin2@blog-alhiwar.com",
        passwordPlain: P_ADMIN,
        role: UserRole.ADMIN,
        username: "admin2",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Admin Two", "dc2626"),
        workflowStatus: UserWorkflowStatus.PUBLISHED,
        isActive: true,
      },

      // Editors (published)
      {
        name: "Editor One",
        email: "editor1@blog-alhiwar.com",
        passwordPlain: P_EDITOR,
        role: UserRole.EDITOR_IN_CHIEF,
        username: "editor1",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Editor One", "059669"),
        workflowStatus: UserWorkflowStatus.PUBLISHED,
        isActive: true,
      },
      {
        name: "Editor Two",
        email: "editor2@blog-alhiwar.com",
        passwordPlain: P_EDITOR,
        role: UserRole.EDITOR_IN_CHIEF,
        username: "editor2",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Editor Two", "059669"),
        workflowStatus: UserWorkflowStatus.PUBLISHED,
        isActive: true,
      },

      // Authors: mix (published/in_review/rejected)
      {
        name: "Author One",
        email: "author1@blog-alhiwar.com",
        passwordPlain: P_AUTHOR,
        role: UserRole.AUTHOR,
        username: "author1",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Author One", "7c3aed"),
        workflowStatus: UserWorkflowStatus.IN_REVIEW,
        isActive: true,
      },
      {
        name: "Author Two",
        email: "author2@blog-alhiwar.com",
        passwordPlain: P_AUTHOR,
        role: UserRole.AUTHOR,
        username: "author2",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Author Two", "7c3aed"),
        workflowStatus: UserWorkflowStatus.REJECTED,
        isActive: true,
        isRejected: true,
        reviewComment: "Profile incomplete: missing bio and phone",
      },

      // Journalists: in_review + draft
      {
        name: "Journalist One",
        email: "journalist1@blog-alhiwar.com",
        passwordPlain: P_JOURNALIST,
        role: UserRole.JOURNALIST,
        username: "journalist1",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Journalist One", "1d4ed8"),
        workflowStatus: UserWorkflowStatus.IN_REVIEW,
        isActive: true,
      },
      {
        name: "Journalist Two",
        email: "journalist2@blog-alhiwar.com",
        passwordPlain: P_JOURNALIST,
        role: UserRole.JOURNALIST,
        username: "journalist2",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("Journalist Two", "1d4ed8"),
        workflowStatus: UserWorkflowStatus.DRAFT,
        isActive: true,
      },

      // Normal users: draft + archived + suspended/inactive mix
      {
        name: "User One",
        email: "user1@blog-alhiwar.com",
        passwordPlain: P_USER,
        role: UserRole.USER,
        username: "user1",
        status: UserStatus.ACTIVE,
        avatar: mkAvatar("User One", "0f172a"),
        workflowStatus: UserWorkflowStatus.DRAFT,
        isActive: true,
      },
      {
        name: "User Two",
        email: "user2@blog-alhiwar.com",
        passwordPlain: P_USER,
        role: UserRole.USER,
        username: "user2",
        status: UserStatus.SUSPENDED,
        avatar: mkAvatar("User Two", "0f172a"),
        workflowStatus: UserWorkflowStatus.ARCHIVED,
        isActive: false,
      },
      {
        name: "User Three",
        email: "user3@blog-alhiwar.com",
        passwordPlain: P_USER,
        role: UserRole.USER,
        username: "user3",
        status: UserStatus.INACTIVE,
        avatar: mkAvatar("User Three", "0f172a"),
        workflowStatus: UserWorkflowStatus.IN_REVIEW,
        isActive: false,
      },
    ];

    let created = 0;
    let skipped = 0;

    // Determine reviewer (admin1) for review fields
    const admin1Email = "admin1@blog-alhiwar.com";
    const admin1 = await repo.findOne({ where: { email: admin1Email } as any });

    for (const u of usersData) {
      const email = u.email.toLowerCase().trim();
      const exists = await repo.findOne({ where: { email } as any });
      if (exists) {
        skipped++;
        continue;
      }

      const hashed = await bcrypt.hash(u.passwordPlain, 12);

      const user = repo.create({
        name: u.name,
        email,
        password: hashed,
        role: u.role,
        username: u.username,
        status: u.status,
        avatar: u.avatar,
        isActive: u.isActive,

        workflowStatus: u.workflowStatus,

        createdById: null,

        submittedAt:
          u.workflowStatus === UserWorkflowStatus.IN_REVIEW ? new Date(Date.now() - 1000 * 60 * 60 * 24) : null,
        submittedById:
          u.workflowStatus === UserWorkflowStatus.IN_REVIEW ? null : null,

        reviewedAt:
          [UserWorkflowStatus.PUBLISHED, UserWorkflowStatus.REJECTED, UserWorkflowStatus.ARCHIVED].includes(u.workflowStatus)
            ? new Date(Date.now() - 1000 * 60 * 60 * 12)
            : null,
        reviewedById:
          [UserWorkflowStatus.PUBLISHED, UserWorkflowStatus.REJECTED, UserWorkflowStatus.ARCHIVED].includes(u.workflowStatus)
            ? (admin1?.id ?? null)
            : null,
        reviewComment:
          u.reviewComment ??
          (u.workflowStatus === UserWorkflowStatus.REJECTED ? "Rejected by reviewer" : null),

        isRejected: u.isRejected ?? (u.workflowStatus === UserWorkflowStatus.REJECTED),
      } as any);

      await repo.save(user);
      created++;
      console.log(`  ✅ Created: ${u.role} / ${u.workflowStatus} -> ${email} (pwd: ${u.passwordPlain})`);
    }

    console.log(`✅ Users: ${created} created, ${skipped} existing\n`);
  }
}
