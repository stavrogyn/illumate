import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddResetPasswordFields1734107000000 implements MigrationInterface {
  name = 'AddResetPasswordFields1734107000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "reset_password_token" character varying
    `)

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "reset_password_expires" TIMESTAMP
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "reset_password_expires"
    `)

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "reset_password_token"
    `)
  }
}

