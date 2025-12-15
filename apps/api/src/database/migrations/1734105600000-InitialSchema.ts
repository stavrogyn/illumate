import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1734105600000 implements MigrationInterface {
  name = 'InitialSchema1734105600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'therapist',
        "locale" character varying NOT NULL DEFAULT 'ru',
        "email_verified" boolean NOT NULL DEFAULT false,
        "verification_token" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `)

    // Create clients table
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "therapist_id" uuid NOT NULL,
        "full_name" character varying NOT NULL,
        "birthday" TIMESTAMP,
        "tags" text NOT NULL DEFAULT '',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id")
      )
    `)

    // Create sessions table
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "therapist_id" uuid NOT NULL,
        "scheduled_at" TIMESTAMP NOT NULL,
        "duration_min" integer NOT NULL DEFAULT 50,
        "status" character varying NOT NULL DEFAULT 'scheduled',
        "notes" text,
        "summary" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
      )
    `)

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD CONSTRAINT "FK_clients_therapist"
      FOREIGN KEY ("therapist_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "FK_sessions_client"
      FOREIGN KEY ("client_id") REFERENCES "clients"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "FK_sessions_therapist"
      FOREIGN KEY ("therapist_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_clients_therapist_id" ON "clients" ("therapist_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_sessions_client_id" ON "sessions" ("client_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_sessions_therapist_id" ON "sessions" ("therapist_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_sessions_scheduled_at" ON "sessions" ("scheduled_at")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_sessions_scheduled_at"`)
    await queryRunner.query(`DROP INDEX "IDX_sessions_therapist_id"`)
    await queryRunner.query(`DROP INDEX "IDX_sessions_client_id"`)
    await queryRunner.query(`DROP INDEX "IDX_clients_therapist_id"`)

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_therapist"`)
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_client"`)
    await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_therapist"`)

    // Drop tables in reverse order (respecting dependencies)
    await queryRunner.query(`DROP TABLE "sessions"`)
    await queryRunner.query(`DROP TABLE "clients"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
