import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1699000000001 implements MigrationInterface {
    name = 'CreateUsersTable1699000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'avatar',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: ['admin', 'author', 'user'],
                        default: "'user'",
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['active', 'inactive', 'suspended'],
                        default: "'active'",
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

        // Créer les index pour optimiser les performances
        await queryRunner.createIndex(
            'users',
            new TableIndex({ name: 'IDX_USERS_EMAIL', columnNames: ['email'] }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({ name: 'IDX_USERS_ROLE', columnNames: ['role'] }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({ name: 'IDX_USERS_STATUS', columnNames: ['status'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL')
        await queryRunner.dropIndex('users', 'IDX_USERS_ROLE')
        await queryRunner.dropIndex('users', 'IDX_USERS_STATUS')
        await queryRunner.dropTable('users');
    }
}
