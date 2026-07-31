import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_split_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum_case_studies_blocks_case_figure_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum_case_studies_blocks_case_cards_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum_case_studies_blocks_case_steps_steps_tone" AS ENUM('accent', 'flag', 'go', 'navy');
  CREATE TYPE "public"."enum_case_studies_blocks_case_steps_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum_case_studies_blocks_case_steps_style" AS ENUM('strip', 'flow', 'grid');
  CREATE TYPE "public"."enum_case_studies_blocks_case_compare_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum_case_studies_blocks_case_statement_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  ALTER TYPE "public"."enum_case_studies_blocks_case_cards_layout" ADD VALUE 'metrics';
  ALTER TABLE "case_studies_blocks_case_split" ADD COLUMN "theme" "enum_case_studies_blocks_case_split_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_split" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_split" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_case_split_locales" ADD COLUMN "quote_label" varchar;
  ALTER TABLE "case_studies_blocks_case_split_locales" ADD COLUMN "quote_footer" varchar;
  ALTER TABLE "case_studies_blocks_case_figure" ADD COLUMN "theme" "enum_case_studies_blocks_case_figure_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_figure" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_figure" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ADD COLUMN "value" varchar;
  ALTER TABLE "case_studies_blocks_case_cards" ADD COLUMN "theme" "enum_case_studies_blocks_case_cards_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_cards" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_cards" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_case_cards" ADD COLUMN "side_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ADD COLUMN "side_image_label" varchar;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ADD COLUMN "side_image_value" varchar;
  ALTER TABLE "case_studies_blocks_case_steps_steps" ADD COLUMN "tone" "enum_case_studies_blocks_case_steps_steps_tone" DEFAULT 'accent';
  ALTER TABLE "case_studies_blocks_case_steps" ADD COLUMN "theme" "enum_case_studies_blocks_case_steps_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_steps" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_steps" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_case_steps" ADD COLUMN "style" "enum_case_studies_blocks_case_steps_style" DEFAULT 'strip';
  ALTER TABLE "case_studies_blocks_case_compare" ADD COLUMN "theme" "enum_case_studies_blocks_case_compare_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_compare" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_compare" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_case_statement" ADD COLUMN "theme" "enum_case_studies_blocks_case_statement_theme" DEFAULT 'auto';
  ALTER TABLE "case_studies_blocks_case_statement" ADD COLUMN "theme_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_statement" ADD COLUMN "accent_edge" boolean DEFAULT false;
  ALTER TABLE "case_studies_locales" ADD COLUMN "title_accent" varchar;
  ALTER TABLE "case_studies_blocks_case_split" ADD CONSTRAINT "case_studies_blocks_case_split_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_figure" ADD CONSTRAINT "case_studies_blocks_case_figure_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards" ADD CONSTRAINT "case_studies_blocks_case_cards_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards" ADD CONSTRAINT "case_studies_blocks_case_cards_side_image_id_media_id_fk" FOREIGN KEY ("side_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_steps" ADD CONSTRAINT "case_studies_blocks_case_steps_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare" ADD CONSTRAINT "case_studies_blocks_case_compare_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_statement" ADD CONSTRAINT "case_studies_blocks_case_statement_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_split_theme_image_idx" ON "case_studies_blocks_case_split" USING btree ("theme_image_id");
  CREATE INDEX "case_studies_blocks_case_figure_theme_image_idx" ON "case_studies_blocks_case_figure" USING btree ("theme_image_id");
  CREATE INDEX "case_studies_blocks_case_cards_theme_image_idx" ON "case_studies_blocks_case_cards" USING btree ("theme_image_id");
  CREATE INDEX "case_studies_blocks_case_cards_side_image_idx" ON "case_studies_blocks_case_cards" USING btree ("side_image_id");
  CREATE INDEX "case_studies_blocks_case_steps_theme_image_idx" ON "case_studies_blocks_case_steps" USING btree ("theme_image_id");
  CREATE INDEX "case_studies_blocks_case_compare_theme_image_idx" ON "case_studies_blocks_case_compare" USING btree ("theme_image_id");
  CREATE INDEX "case_studies_blocks_case_statement_theme_image_idx" ON "case_studies_blocks_case_statement" USING btree ("theme_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_split" DROP CONSTRAINT "case_studies_blocks_case_split_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_figure" DROP CONSTRAINT "case_studies_blocks_case_figure_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_cards" DROP CONSTRAINT "case_studies_blocks_case_cards_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_cards" DROP CONSTRAINT "case_studies_blocks_case_cards_side_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_steps" DROP CONSTRAINT "case_studies_blocks_case_steps_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_compare" DROP CONSTRAINT "case_studies_blocks_case_compare_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_statement" DROP CONSTRAINT "case_studies_blocks_case_statement_theme_image_id_media_id_fk";
  
  ALTER TABLE "case_studies_blocks_case_cards" ALTER COLUMN "layout" SET DATA TYPE text;
  ALTER TABLE "case_studies_blocks_case_cards" ALTER COLUMN "layout" SET DEFAULT 'uniform'::text;
  DROP TYPE "public"."enum_case_studies_blocks_case_cards_layout";
  CREATE TYPE "public"."enum_case_studies_blocks_case_cards_layout" AS ENUM('uniform', 'bento');
  ALTER TABLE "case_studies_blocks_case_cards" ALTER COLUMN "layout" SET DEFAULT 'uniform'::"public"."enum_case_studies_blocks_case_cards_layout";
  ALTER TABLE "case_studies_blocks_case_cards" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_case_studies_blocks_case_cards_layout" USING "layout"::"public"."enum_case_studies_blocks_case_cards_layout";
  DROP INDEX "case_studies_blocks_case_split_theme_image_idx";
  DROP INDEX "case_studies_blocks_case_figure_theme_image_idx";
  DROP INDEX "case_studies_blocks_case_cards_theme_image_idx";
  DROP INDEX "case_studies_blocks_case_cards_side_image_idx";
  DROP INDEX "case_studies_blocks_case_steps_theme_image_idx";
  DROP INDEX "case_studies_blocks_case_compare_theme_image_idx";
  DROP INDEX "case_studies_blocks_case_statement_theme_image_idx";
  ALTER TABLE "case_studies_blocks_case_split" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_split" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_split" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_blocks_case_split_locales" DROP COLUMN "quote_label";
  ALTER TABLE "case_studies_blocks_case_split_locales" DROP COLUMN "quote_footer";
  ALTER TABLE "case_studies_blocks_case_figure" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_figure" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_figure" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" DROP COLUMN "value";
  ALTER TABLE "case_studies_blocks_case_cards" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_cards" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_cards" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_blocks_case_cards" DROP COLUMN "side_image_id";
  ALTER TABLE "case_studies_blocks_case_cards_locales" DROP COLUMN "side_image_label";
  ALTER TABLE "case_studies_blocks_case_cards_locales" DROP COLUMN "side_image_value";
  ALTER TABLE "case_studies_blocks_case_steps_steps" DROP COLUMN "tone";
  ALTER TABLE "case_studies_blocks_case_steps" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_steps" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_steps" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_blocks_case_steps" DROP COLUMN "style";
  ALTER TABLE "case_studies_blocks_case_compare" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_compare" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_compare" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_blocks_case_statement" DROP COLUMN "theme";
  ALTER TABLE "case_studies_blocks_case_statement" DROP COLUMN "theme_image_id";
  ALTER TABLE "case_studies_blocks_case_statement" DROP COLUMN "accent_edge";
  ALTER TABLE "case_studies_locales" DROP COLUMN "title_accent";
  DROP TYPE "public"."enum_case_studies_blocks_case_split_theme";
  DROP TYPE "public"."enum_case_studies_blocks_case_figure_theme";
  DROP TYPE "public"."enum_case_studies_blocks_case_cards_theme";
  DROP TYPE "public"."enum_case_studies_blocks_case_steps_steps_tone";
  DROP TYPE "public"."enum_case_studies_blocks_case_steps_theme";
  DROP TYPE "public"."enum_case_studies_blocks_case_steps_style";
  DROP TYPE "public"."enum_case_studies_blocks_case_compare_theme";
  DROP TYPE "public"."enum_case_studies_blocks_case_statement_theme";`)
}
