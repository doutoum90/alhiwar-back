import { AppDataSource } from "../data-source";
import { Permission } from "../../entities/permission.entity";

export const PERMISSIONS = [
  { key: "users.view", label: "View users", group: "Users" },
  { key: "users.create", label: "Create users", group: "Users" },
  { key: "users.update", label: "Update users", group: "Users" },
  { key: "users.delete", label: "Delete users", group: "Users" },
  { key: "users.activate", label: "Activate/Deactivate account", group: "Users" },
  { key: "users.roles.assign", label: "Assign roles/permissions", group: "Users" },
  { key: "users.stats.view", label: "View users stats", group: "Stats" },

  { key: "users.submit", label: "Submit user for review", group: "Users Workflow" },
  { key: "users.review.view", label: "View users review queue", group: "Users Workflow" },
  { key: "users.review.approve", label: "Approve user", group: "Users Workflow" },
  { key: "users.review.reject", label: "Reject user", group: "Users Workflow" },
  { key: "users.archive", label: "Archive user", group: "Users Workflow" },

  { key: "authors.view", label: "View authors", group: "Users" },
  { key: "authors.create", label: "Create author", group: "Users" },
  { key: "authors.update", label: "Update author", group: "Users" },
  { key: "authors.delete", label: "Delete author", group: "Users" },
  { key: "authors.stats.view", label: "View authors stats", group: "Stats" },
  { key: "authors.password.change", label: "Change author password", group: "Users" },
  { key: "authors.status.toggle", label: "Toggle author status", group: "Users" },
  { key: "authors.suspend", label: "Suspend author", group: "Users" },
  { key: "authors.activate", label: "Activate author", group: "Users" },

  { key: "auth.stats.view", label: "View auth stats", group: "Stats" },

  { key: "articles.view", label: "View articles", group: "Articles" },
  { key: "articles.create", label: "Create articles", group: "Articles" },
  { key: "articles.update", label: "Update articles", group: "Articles" },
  { key: "articles.delete", label: "Delete articles", group: "Articles" },

  { key: "articles.submit_review", label: "Submit to review", group: "Articles Workflow" },
  { key: "articles.review.view", label: "View review queue", group: "Articles Workflow" },
  { key: "articles.review.approve", label: "Approve article", group: "Articles Workflow" },
  { key: "articles.review.reject", label: "Reject article", group: "Articles Workflow" },

  { key: "articles.publish", label: "Publish article", group: "Articles Workflow" },
  { key: "articles.unpublish", label: "Unpublish article", group: "Articles Workflow" },
  { key: "articles.archive", label: "Archive article", group: "Articles Workflow" },

  { key: "articles.stats.view", label: "View articles stats", group: "Stats" },

  { key: "categories.view", label: "View categories", group: "Categories" },
  { key: "categories.create", label: "Create categories", group: "Categories" },
  { key: "categories.update", label: "Update categories", group: "Categories" },
  { key: "categories.delete", label: "Delete categories", group: "Categories" },
  { key: "categories.reorder", label: "Reorder categories", group: "Categories" },
  { key: "categories.stats.view", label: "View categories stats", group: "Stats" },

  { key: "categories.submit", label: "Submit category for review", group: "Categories Workflow" },
  { key: "categories.review.view", label: "View categories review queue", group: "Categories Workflow" },
  { key: "categories.review.approve", label: "Approve category", group: "Categories Workflow" },
  { key: "categories.review.reject", label: "Reject category", group: "Categories Workflow" },
  { key: "categories.archive", label: "Archive category", group: "Categories Workflow" },

  { key: "media.view", label: "View media", group: "Media" },
  { key: "media.upload", label: "Upload media", group: "Media" },
  { key: "media.update", label: "Update media", group: "Media" },
  { key: "media.delete", label: "Delete media", group: "Media" },
  { key: "media.reorder", label: "Reorder media", group: "Media" },

  { key: "comments.view", label: "View comments", group: "Comments" },
  { key: "comments.create", label: "Create comment", group: "Comments" },
  { key: "comments.delete", label: "Delete comment", group: "Comments" },
  { key: "comments.moderate", label: "Moderate comment", group: "Comments" },

  { key: "likes.toggle", label: "Like/Unlike", group: "Engagement" },
  { key: "likes.view", label: "View likes", group: "Engagement" },

  { key: "ads.view", label: "View ads", group: "Ads" },
  { key: "ads.create", label: "Create ads", group: "Ads" },
  { key: "ads.update", label: "Update ads", group: "Ads" },
  { key: "ads.delete", label: "Delete ads", group: "Ads" },
  { key: "ads.activate", label: "Activate/Deactivate ads", group: "Ads" },
  { key: "ads.stats.view", label: "View ads stats", group: "Stats" },

  { key: "ads.submit", label: "Submit ad for review", group: "Ads Workflow" },
  { key: "ads.review.view", label: "View ads review queue", group: "Ads Workflow" },
  { key: "ads.review.approve", label: "Approve ad", group: "Ads Workflow" },
  { key: "ads.review.reject", label: "Reject ad", group: "Ads Workflow" },
  { key: "ads.archive", label: "Archive ad", group: "Ads Workflow" },

  { key: "newsletter.view", label: "View subscribers", group: "Newsletter" },
  { key: "newsletter.create", label: "Create subscription", group: "Newsletter" },
  { key: "newsletter.update", label: "Update subscriber", group: "Newsletter" },
  { key: "newsletter.delete", label: "Delete subscriber", group: "Newsletter" },
  { key: "newsletter.send", label: "Send campaign", group: "Newsletter" },
  { key: "newsletter.stats.view", label: "View newsletter stats", group: "Stats" },

  { key: "contacts.view", label: "View contact messages", group: "Contacts" },
  { key: "contacts.reply", label: "Reply to contacts", group: "Contacts" },
  { key: "contacts.delete", label: "Delete contact message", group: "Contacts" },
  { key: "contacts.mark_read", label: "Mark read/unread", group: "Contacts" },
  { key: "contacts.archive", label: "Archive/unarchive messages", group: "Contacts" },
  { key: "contacts.stats.view", label: "View contacts stats", group: "Stats" },

  { key: "settings.view", label: "View app settings", group: "Settings" },
  { key: "settings.update", label: "Update app settings", group: "Settings" },

  { key: "db.stats.view", label: "View database stats", group: "DB Admin" },
  { key: "db.backup", label: "Run database backup", group: "DB Admin" },
  { key: "db.optimize", label: "Optimize database", group: "DB Admin" },
  { key: "db.cleanup_logs", label: "Cleanup database logs", group: "DB Admin" },

  { key: "api_keys.view", label: "View API keys", group: "API Keys" },
  { key: "api_keys.create", label: "Create API key", group: "API Keys" },
  { key: "api_keys.update", label: "Update API key", group: "API Keys" },
  { key: "api_keys.delete", label: "Delete API key", group: "API Keys" },

  { key: "rbac.roles.view", label: "View RBAC roles", group: "RBAC" },
  { key: "rbac.roles.create", label: "Create RBAC role", group: "RBAC" },
  { key: "rbac.roles.update", label: "Update RBAC role", group: "RBAC" },
  { key: "rbac.roles.delete", label: "Delete RBAC role", group: "RBAC" },

  { key: "rbac.permissions.view", label: "View permissions", group: "RBAC" },
  { key: "rbac.permissions.assign", label: "Assign permissions to roles", group: "RBAC" },
  { key: "rbac.users.assign_roles", label: "Assign roles to users", group: "RBAC" },

  { key: "stats.dashboard.view", label: "View stats dashboard", group: "Stats" },
] as const;

export class PermissionsSeeder {
  public static async run(): Promise<void> {
    console.log("🧩 Seeding permissions...");

    const repo = AppDataSource.getRepository(Permission);

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const p of PERMISSIONS) {
      const key = p.key.trim();
      const existing = await repo.findOne({ where: { key } });

      if (!existing) {
        await repo.save(repo.create({ key, label: p.label ?? null, group: (p as any).group ?? null } as any));
        created++;
        continue;
      }

      const nextLabel = p.label ?? null;

      let dirty = false;
      if (existing.label !== nextLabel) {
        existing.label = nextLabel;
        dirty = true;
      }

      if ("group" in existing && (existing as any).group !== (p as any).group) {
        (existing as any).group = (p as any).group ?? null;
        dirty = true;
      }

      if (dirty) {
        await repo.save(existing);
        updated++;
      } else {
        unchanged++;
      }
    }

    console.log(`✅ Permissions: ${created} created, ${updated} updated, ${unchanged} unchanged\n`);
  }
}
