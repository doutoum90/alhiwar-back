import { AppDataSource } from "../data-source";
import { ApiKey } from "../../entities/api-key.entity";
import { randomBytes, createHash } from "crypto";
import { PERMISSIONS } from "./00-permissions.seeder";


const mkSecret = (lenBytes = 24) => randomBytes(lenBytes).toString("hex"); // 48 chars
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

const pickPerms = (prefix: string) =>
    PERMISSIONS.filter((p) => p.key.startsWith(prefix)).map((p) => p.key);

export class ApiKeysSeeder {
    public static async run(): Promise<void> {
        console.log("🔑 Seeding api_keys...");

        const repo = AppDataSource.getRepository(ApiKey);

        // ✅ Deux clés utiles
        // 1) Key "server" : permissions techniques minimales (stats + read)
        // 2) Key "admin" : presque tout (utile pour tests)
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
            // secret brut (à afficher UNE SEULE FOIS dans les logs)
            const rawSecret = mkSecret(24);
            const prefix = `ak_${rawSecret.slice(0, 12)}`; // 32 max => OK (ici ~15)
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
                // Update sans régénérer le secret par défaut (sinon tu casses les tests)
                existing.permissions = k.permissions;
                existing.isActive = k.isActive;

                // Option: si tu veux forcer une rotation à chaque seed:
                // existing.prefix = prefix;
                // existing.keyHash = keyHash;
                // console.log(`     🔁 ROTATED SECRET: ${rawSecret}`);

                await repo.save(existing);
                updated++;
                console.log(`  🔁 Updated API key: ${k.name}`);
            }
        }

        console.log(`✅ ApiKeys: ${created} created, ${updated} updated\n`);
    }
}
