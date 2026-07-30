import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_cards_layout" AS ENUM('uniform', 'bento');
  ALTER TABLE "case_studies_blocks_case_cards" ADD COLUMN "layout" "enum_case_studies_blocks_case_cards_layout" DEFAULT 'uniform';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_cards" DROP COLUMN "layout";
  DROP TYPE "public"."enum_case_studies_blocks_case_cards_layout";`)
}
