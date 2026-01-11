import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdsTable1699000000003 implements MigrationInterface {
    name = 'CreateAdsTable1699000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'ads',
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
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'imageUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'targetUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'adType',
                        type: 'enum',
                        enum: ['banner', 'sidebar', 'inline', 'popup'],
                        default: "'banner'",
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['active', 'inactive', 'expired'],
                        default: "'active'",
                    },
                    {
                        name: 'views',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'clicks',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'budget',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'price',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'startDate',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'endDate',
                        type: 'date',
                        isNullable: false,
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

        await queryRunner.createIndex(
            'ads',
            new TableIndex({ name: 'IDX_ADS_STATUS', columnNames: ['status'] }),
        );

        await queryRunner.createIndex(
            'ads',
            new TableIndex({ name: 'IDX_ADS_TYPE', columnNames: ['adType'] }),
        );

        await queryRunner.createIndex(
            'ads',
            new TableIndex({ name: 'IDX_ADS_DATES', columnNames: ['startDate', 'endDate'] }),
        );

        await queryRunner.createIndex(
            'ads',
            new TableIndex({ name: 'IDX_ADS_CREATED_AT', columnNames: ['createdAt'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('ads', 'IDX_ADS_STATUS');
        await queryRunner.dropIndex('ads', 'IDX_ADS_TYPE');
        await queryRunner.dropIndex('ads', 'IDX_ADS_DATES');
        await queryRunner.dropIndex('ads', 'IDX_ADS_CREATED_AT');
        await queryRunner.dropTable('ads');
    }
}
