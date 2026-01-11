import { AppDataSource } from "../data-source";
import { Role } from "../../entities/role.entity";
import { Permission } from "../../entities/permission.entity";
import { RolePermission } from "../../entities/role-permission.entity";

const pick = (all: Permission[], keys: string[]) => {
  const set = new Set(keys);
  return all.filter((p) => set.has(p.key));
};

const byPrefix = (all: Permission[], prefixes: string[]) =>
  all.filter((p) => prefixes.some((pref) => p.key.startsWith(pref)));

const SYNC = true;

export class RolePermissionsSeeder {
  public static async run(): Promise<void> {
    console.log("🔗 Seeding role_permissions...");

    const roleRepo = AppDataSource.getRepository(Role);
    const permRepo = AppDataSource.getRepository(Permission);
    const rpRepo = AppDataSource.getRepository(RolePermission);

    const roles = await roleRepo.find();
    const perms = await permRepo.find();

    const roleByKey = new Map(roles.map((r) => [r.key, r]));
    const getRole = (k: string) => {
      const r = roleByKey.get(k);
      if (!r) throw new Error(`Role not found: ${k}`);
      return r;
    };

    const adminPerms = perms;

    const editorPerms = perms.filter((p) => p.key !== "api_keys.delete");

    const authorPerms = perms.filter((p) => {
      const blocked = new Set<string>([
        "users.create",
        "users.update",
        "users.delete",
        "users.roles.assign",
        "users.activate",
        "users.review.view",
        "users.review.approve",
        "users.review.reject",
        "users.archive",

        "rbac.roles.create",
        "rbac.roles.update",
        "rbac.roles.delete",
        "rbac.permissions.assign",
        "rbac.users.assign_roles",

        "settings.view",
        "settings.update",

        "db.stats.view",
        "db.backup",
        "db.optimize",
        "db.cleanup_logs",

        "api_keys.view",
        "api_keys.create",
        "api_keys.update",
        "api_keys.delete",

        "newsletter.send",

        "articles.review.view",
        "articles.review.approve",
        "articles.review.reject",
        "articles.publish",
        "articles.unpublish",
        "articles.archive",

        "categories.review.view",
        "categories.review.approve",
        "categories.review.reject",
        "categories.archive",

        "ads.review.view",
        "ads.review.approve",
        "ads.review.reject",
        "ads.archive",
      ]);

      if (blocked.has(p.key)) return false;

      return true;
    });

    const journalistPerms = pick(perms, [
      "users.view",
      "users.stats.view",
      "users.submit",
      "authors.view",
      "authors.create",
      "authors.update",
      "authors.delete",
      "authors.stats.view",
      "authors.password.change",
      "authors.status.toggle",
      "authors.suspend",
      "authors.activate",
      "auth.stats.view",
      "articles.view",
      "articles.create",
      "articles.update",
      "articles.delete",
      "articles.submit_review",
      "articles.stats.view",
      "categories.view",
      "categories.create",
      "categories.update",
      "categories.delete",
      "categories.reorder",
      "categories.stats.view",
      "categories.submit",
      "media.view",
      "media.upload",
      "media.update",
      "media.delete",
      "media.reorder",
      "comments.view",
      "comments.create",
      "comments.delete",
      "comments.moderate",
      "likes.toggle",
      "likes.view",
      "ads.view",
      "ads.create",
      "ads.update",
      "ads.delete",
      "ads.activate",
      "ads.stats.view",
      "ads.submit",
      "newsletter.view",
      "newsletter.create",
      "newsletter.update",
      "newsletter.delete",
      "newsletter.stats.view",
      "contacts.view",
      "contacts.reply",
      "contacts.delete",
      "contacts.mark_read",
      "contacts.archive",
    ]);


    const userPerms = pick(perms, [
      "articles.view",
      "categories.view",
      "comments.create",
      "likes.toggle",
      "newsletter.create",
    ]);

    const mapping: Array<{ roleKey: string; list: Permission[] }> = [
      { roleKey: "admin", list: adminPerms },
      { roleKey: "editor_in_chief", list: editorPerms },
      { roleKey: "author", list: authorPerms },
      { roleKey: "journalist", list: journalistPerms },
      { roleKey: "user", list: userPerms },
    ];

    let added = 0;
    let removed = 0;
    let rolesUnchanged = 0;

    for (const m of mapping) {
      const role = getRole(m.roleKey);
      const expectedIds = new Set(m.list.map((p) => p.id));

      const existing = await rpRepo.find({ where: { roleId: role.id } as any });
      const existingIds = new Set(existing.map((x) => x.permissionId));

      const toAdd = [...expectedIds].filter((pid) => !existingIds.has(pid));
      if (toAdd.length) {
        await rpRepo.insert(toAdd.map((pid) => ({ roleId: role.id, permissionId: pid })));
        added += toAdd.length;
      }

      if (SYNC) {
        const toRemove = existing.filter((x) => !expectedIds.has(x.permissionId));
        if (toRemove.length) {
          await rpRepo.delete(toRemove.map((x) => x.id));
          removed += toRemove.length;
        }
      }

      if (!toAdd.length) rolesUnchanged++;
    }

    console.log(`✅ RolePermissions: ${added} added, ${removed} removed, ${rolesUnchanged} roles unchanged\n`);
  }
}
