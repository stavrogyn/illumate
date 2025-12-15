import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserNameFields1765661891863 implements MigrationInterface {
    name = 'AddUserNameFields1765661891863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_therapist"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_client"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_therapist"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_therapist_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_therapist_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_scheduled_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "first_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'ru'`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_f2310b33d72057992d0610245fe" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_7af6ac1cd093d361012865a0a48" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_873b2cad08bd8d41f11af3d9f4c" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_873b2cad08bd8d41f11af3d9f4c"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_7af6ac1cd093d361012865a0a48"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_f2310b33d72057992d0610245fe"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_scheduled_at" ON "sessions" ("scheduled_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_therapist_id" ON "sessions" ("therapist_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_client_id" ON "sessions" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_therapist_id" ON "clients" ("therapist_id") `);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_therapist" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_therapist" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
