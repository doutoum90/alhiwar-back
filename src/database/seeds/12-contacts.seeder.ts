import { AppDataSource } from "../data-source";
import { Contact } from "../../entities/contact.entity";

const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

export class ContactsSeeder {
    public static async run(): Promise<void> {
        console.log("📩 Seeding contacts...");

        const repo = AppDataSource.getRepository(Contact);

        const rows: Array<Partial<Contact>> = [
            {
                name: "Visitor One",
                email: "visitor1@mail.com",
                subject: "Demande d'information",
                phone: "+235 66 00 00 01",
                company: "Entreprise A",
                message: "Bonjour, je souhaite publier un article sponsorisé. Pouvez-vous me donner vos tarifs et délais ?",
                isRead: false,
                archivedAt: null,
                ipAddress: "127.0.0.1",
                userAgent: "Seeder/ContactsSeeder",
            },
            {
                name: "Visitor Two",
                email: "visitor2@mail.com",
                subject: "Bug sur le site",
                phone: "+235 66 00 00 02",
                company: undefined,
                message: "Bonjour, je n'arrive pas à ouvrir un article. J'ai une erreur 404 sur /articles/slug/xxx.",
                isRead: false,
                archivedAt: null,
                ipAddress: "127.0.0.1",
                userAgent: "Seeder/ContactsSeeder",
            },
            {
                name: "Partenaire Média",
                email: "partner@media.com",
                subject: "Partenariat",
                phone: "+33 6 00 00 00 00",
                company: "Media Partner",
                message: "Bonjour, nous proposons un partenariat éditorial. Seriez-vous disponible pour un échange ?",
                isRead: true,
                archivedAt: null,
                ipAddress: "192.168.1.20",
                userAgent: "Seeder/ContactsSeeder",
            },
            {
                name: "Client Pub",
                email: "client.ads@company.com",
                subject: "Publicité",
                phone: undefined,
                company: "Company Ads",
                message: "Bonjour, je veux réserver un espace publicitaire sidebar pendant 3 mois. Comment procéder ?",
                isRead: true,
                archivedAt: null,
                ipAddress: "10.0.0.12",
                userAgent: "Seeder/ContactsSeeder",
            },
            {
                name: "Ancien message (archivé)",
                email: "old1@mail.com",
                subject: "Ancienne demande",
                phone: undefined,
                company: undefined,
                message: "Bonjour, ceci est un message ancien pour tester l'archivage.",
                isRead: true,
                archivedAt: daysAgo(20),
                ipAddress: "172.16.0.10",
                userAgent: "Seeder/ContactsSeeder",
            },
            {
                name: "Ancienne relance (archivée)",
                email: "old2@mail.com",
                subject: "Relance",
                phone: "+235 66 00 00 99",
                company: "Old Co",
                message: "Bonjour, je relance au sujet de ma demande précédente.",
                isRead: true,
                archivedAt: daysAgo(45),
                ipAddress: "172.16.0.11",
                userAgent: "Seeder/ContactsSeeder",
            },
        ];

        let created = 0;
        let skipped = 0;

        for (const r of rows) {
            const exists = await repo.findOne({
                where: { email: r.email!, subject: r.subject! },
            });

            if (exists) {
                skipped++;
                continue;
            }

            const entity = repo.create({
                name: r.name!,
                email: r.email!,
                message: r.message!,
                subject: r.subject,
                phone: r.phone,
                company: r.company,
                isRead: r.isRead ?? false,
                archivedAt: r.archivedAt ?? null,
                ipAddress: r.ipAddress,
                userAgent: r.userAgent,
            });

            await repo.save(entity);
            created++;
        }

        console.log(`✅ Contacts: ${created} created, ${skipped} skipped\n`);
    }
}
