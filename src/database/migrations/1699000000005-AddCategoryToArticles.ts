import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCategoryToArticles1699000000005 implements MigrationInterface {
  name = 'AddCategoryToArticles1699000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne categoryId
    await queryRunner.addColumn(
      'articles',
      new TableColumn({
        name: 'categoryId',
        type: 'int',
        isNullable: true,
      }),
    );

    // Créer la clé étrangère
    await queryRunner.createForeignKey(
      'articles',
      new TableForeignKey({
        name: 'FK_ARTICLES_CATEGORY',
        columnNames: ['categoryId'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('articles', 'FK_ARTICLES_CATEGORY');
    await queryRunner.dropColumn('articles', 'categoryId');
  }
}
