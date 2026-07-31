import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_steps_steps_pictogram" AS ENUM('none', 'ai', 'network');
  ALTER TABLE "case_studies_blocks_case_steps_steps" ADD COLUMN "pictogram" "enum_case_studies_blocks_case_steps_steps_pictogram" DEFAULT 'none';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_steps_steps" DROP COLUMN "pictogram";
  DROP TYPE "public"."enum_case_studies_blocks_case_steps_steps_pictogram";`)
}
