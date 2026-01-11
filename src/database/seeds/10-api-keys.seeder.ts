import { AppDataSource } from "../data-source";
import { ApiKey } from "../../entities/api-key.entity";
import { createHash } from "crypto";
import { PERMISSIONS } from "./00-permissions.seeder";
import { randomHex } from "./utils/crypto";


const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export class ApiKeysSeeder {
    public static async run(): Promise<void> {
        console.log("🔑 Seeding api_keys...");

        const repo = AppDataSource.getRepository(ApiKey);

        const keysPlan = [
            {
                name: "Server key (read + stats)",
                permissions: [
                    "stats.dashboard.view",
                    "users.view",
                    "users.stats.view",
                    "articles.view",
                    "articles.stats.view",
                    "categories.view",
                    "categories.stats.view",
                    "ads.view",
                    "ads.stats.view",
                    "newsletter.view",
                    "newsletter.stats.view",
                    "contacts.view",
                    "settings.view",
                    "api_keys.view",
                ],
                isActive: true,
            },
            {
                name: "Admin key (full access)",
                permissions: PERMISSIONS.map((p) => p.key),
                isActive: true,
            },
        ];

        let created = 0;
        let updated = 0;

        for (const k of keysPlan) {
            const rawSecret = randomHex(24);
            const prefix = `ak_${rawSecret.slice(0, 12)}`;
            const keyHash = sha256(rawSecret);

            const existing = await repo.findOne({ where: { name: k.name } });

            if (!existing) {
                const entity = repo.create({
                    name: k.name,
                    prefix,
                    keyHash,
                    permissions: k.permissions,
                    isActive: k.isActive,
                    lastUsedAt: null,
                });

                await repo.save(entity);
                created++;
                console.log(`  ✅ Created API key: ${k.name}`);
                console.log(`     🔐 RAW SECRET (show once): ${rawSecret}`);
            } else {
                existing.permissions = k.permissions;
                existing.isActive = k.isActive;


                await repo.save(existing);
                updated++;
                console.log(`  🔁 Updated API key: ${k.name}`);
            }
        }

        console.log(`✅ ApiKeys: ${created} created, ${updated} updated\n`);
    }
}
