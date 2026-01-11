import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateArticlesTable1699000000002 implements MigrationInterface {
    name = 'CreateArticlesTable1699000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'articles',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'slug',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'excerpt',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'content',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'featuredImage',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'published', 'archived'],
                        default: "'draft'",
                    },
                    {
                        name: 'views',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'likes',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'authorId',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'publishedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
        );

        // Clé étrangère vers la table users
        await queryRunner.createForeignKey(
            'articles',
            new TableForeignKey({
                columnNames: ['authorId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                name: 'FK_ARTICLES_AUTHOR_ID',
            }),
        );

        // Index pour optimiser les performances
        await queryRunner.createIndex(
            'articles',
            new TableIndex({ name: 'IDX_ARTICLES_SLUG', columnNames: ['slug'], isUnique: true }),
        );

        await queryRunner.createIndex(
            'articles',
            new TableIndex({ name: 'IDX_ARTICLES_STATUS', columnNames: ['status'] }),
        );

        await queryRunner.createIndex(
            'articles',
            new TableIndex({ name: 'IDX_ARTICLES_AUTHOR_ID', columnNames: ['authorId'] }),
        );

        await queryRunner.createIndex(
            'articles',
            new TableIndex({ name: 'IDX_ARTICLES_PUBLISHED_AT', columnNames: ['publishedAt'] }),
        );

        await queryRunner.createIndex(
            'articles',
            new TableIndex({ name: 'IDX_ARTICLES_CREATED_AT', columnNames: ['createdAt'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('articles', 'IDX_ARTICLES_SLUG')
        await queryRunner.dropIndex('articles', 'IDX_ARTICLES_STATUS')
        await queryRunner.dropIndex('articles', 'IDX_ARTICLES_AUTHOR_ID')
        await queryRunner.dropIndex('articles', 'IDX_ARTICLES_PUBLISHED_AT')
        await queryRunner.dropIndex('articles', 'IDX_ARTICLES_CREATED_AT')
        await queryRunner.dropForeignKey('articles', 'FK_ARTICLES_AUTHOR_ID')
        await queryRunner.dropTable('articles');
    }
}
