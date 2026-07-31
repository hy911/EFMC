import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_figure_variant" AS ENUM('full', 'side');
  ALTER TABLE "case_studies_blocks_case_figure" ADD COLUMN "variant" "enum_case_studies_blocks_case_figure_variant" DEFAULT 'full';
  ALTER TABLE "case_studies_blocks_case_steps_locales" ADD COLUMN "cell_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_figure" DROP COLUMN "variant";
  ALTER TABLE "case_studies_blocks_case_steps_locales" DROP COLUMN "cell_label";
  DROP TYPE "public"."enum_case_studies_blocks_case_figure_variant";`)
}
