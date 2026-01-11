import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCategoriesTable1699000000004 implements MigrationInterface {
  name = 'CreateCategoriesTable1699000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '500',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            default: "'#3B82F6'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORIES_SLUG',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORIES_STATUS',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('categories', 'IDX_CATEGORIES_STATUS');
    await queryRunner.dropIndex('categories', 'IDX_CATEGORIES_SLUG');
    await queryRunner.dropTable('categories');
  }
}
