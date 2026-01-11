import { AppDataSource } from "../data-source";
import { User, UserRole } from "../../entities/user.entity";
import { Role } from "../../entities/role.entity";
import { UserRoleLink } from "../../entities/user-role.entity";

const mapUserRoleToRoleKey = (userRole: UserRole | string) => {
  const r = String(userRole);
  if (r === "admin") return "admin";
  if (r === "editor") return "editor_in_chief";
  if (r === "journalist") return "journalist";
  if (r === "author") return "author";
  return "user";
};

const SYNC_SINGLE_ROLE = false;

export class UserRoleLinksSeeder {
  public static async run(): Promise<void> {
    console.log("👤 Seeding user_roles (RBAC links)...");

    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const linkRepo = AppDataSource.getRepository(UserRoleLink);

    const roles = await roleRepo.find();
    const roleByKey = new Map(roles.map((r) => [r.key, r]));

    const users = await userRepo.find();
    const links = await linkRepo.find();

    const linkSet = new Set(links.map((l) => `${l.userId}:${l.roleId}`));

    let created = 0;
    let removed = 0;
    let skipped = 0;

    const toInsert: Array<{ userId: string; roleId: string }> = [];

    for (const u of users) {
      const roleKey = mapUserRoleToRoleKey(u.role);
      const role = roleByKey.get(roleKey);
      if (!role) continue;

      const k = `${u.id}:${role.id}`;
      if (linkSet.has(k)) {
        skipped++;
      } else {
        toInsert.push({ userId: u.id, roleId: role.id });
        linkSet.add(k);
      }
    }

    if (toInsert.length) {
      await linkRepo.insert(toInsert);
      created = toInsert.length;
    }

    if (SYNC_SINGLE_ROLE) {
      const freshLinks = await linkRepo.find();
      const expectedRoleByUser = new Map<string, string>();

      for (const u of users) {
        const roleKey = mapUserRoleToRoleKey(u.role);
        const role = roleByKey.get(roleKey);
        if (role) expectedRoleByUser.set(u.id, role.id);
      }

      const toDelete = freshLinks.filter((l) => expectedRoleByUser.get(l.userId) && expectedRoleByUser.get(l.userId) !== l.roleId);
      if (toDelete.length) {
        await linkRepo.delete(toDelete.map((x) => x.id));
        removed = toDelete.length;
      }
    }

    console.log(`✅ UserRoleLinks: ${created} created, ${removed} removed, ${skipped} skipped\n`);
  }
}
