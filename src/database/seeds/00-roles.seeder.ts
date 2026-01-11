// src/database/seeds/00-roles.seeder.ts
import { AppDataSource } from "../data-source";
import { Role } from "../../entities/role.entity";

const ROLES = [
    { key: "admin", name: "Administrateur" },
    { key: "editor_in_chief", name: "Rédacteur en chef" },
    { key: "journalist", name: "Journaliste" },
    { key: "author", name: "Auteur" },
    { key: "user", name: "Utilisateur" },
] as const;

export class RolesSeeder {
    public static async run(): Promise<void> {
        console.log("🎭 Seeding roles...");

        const repo = AppDataSource.getRepository(Role);

        let created = 0;
        let updated = 0;
        let unchanged = 0;

        for (const r of ROLES) {
            const key = r.key.trim();
            const name = r.name.trim();

            const existing = await repo.findOne({ where: { key } });

            if (!existing) {
                await repo.save(repo.create({ key, name }));
                created++;
                continue;
            }

            if (existing.name !== name) {
                existing.name = name;
                await repo.save(existing);
                updated++;
            } else {
                unchanged++;
            }
        }

        console.log(`✅ Roles: ${created} created, ${updated} updated, ${unchanged} unchanged\n`);
    }
}
