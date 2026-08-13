import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNovedadesTables1712588400000 implements MigrationInterface {
  name = 'CreateNovedadesTables1712588400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categoria_novedad" (
        "id_categoria" SERIAL PRIMARY KEY,
        "nombre" VARCHAR(100) NOT NULL UNIQUE,
        "descripcion" VARCHAR(255),
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "novedad" (
        "id_novedad" SERIAL PRIMARY KEY,
        "id_orden" INTEGER NOT NULL,
        "id_categoria" INTEGER NOT NULL,
        "descripcion" TEXT NOT NULL,
        "estado" VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
        "usuario_registro" VARCHAR(150) NOT NULL,
        "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(),
        "fecha_actualizacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_novedad_orden" FOREIGN KEY ("id_orden")
          REFERENCES "orden_venta"("id_orden") ON DELETE RESTRICT,
        CONSTRAINT "fk_novedad_categoria" FOREIGN KEY ("id_categoria")
          REFERENCES "categoria_novedad"("id_categoria") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "historial_novedad" (
        "id_historial" SERIAL PRIMARY KEY,
        "id_novedad" INTEGER NOT NULL,
        "accion" VARCHAR(50) NOT NULL,
        "estado_anterior" VARCHAR(20),
        "estado_nuevo" VARCHAR(20),
        "detalle" TEXT,
        "usuario" VARCHAR(150) NOT NULL,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_historial_novedad" FOREIGN KEY ("id_novedad")
          REFERENCES "novedad"("id_novedad") ON DELETE CASCADE
      )
    `);

    // Indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "idx_novedad_orden" ON "novedad"("id_orden")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_novedad_estado" ON "novedad"("estado")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_novedad_categoria" ON "novedad"("id_categoria")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_historial_novedad" ON "historial_novedad"("id_novedad")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_historial_novedad"`);
    await queryRunner.query(`DROP INDEX "idx_novedad_categoria"`);
    await queryRunner.query(`DROP INDEX "idx_novedad_estado"`);
    await queryRunner.query(`DROP INDEX "idx_novedad_orden"`);
    await queryRunner.query(`DROP TABLE "historial_novedad"`);
    await queryRunner.query(`DROP TABLE "novedad"`);
    await queryRunner.query(`DROP TABLE "categoria_novedad"`);
  }
}
