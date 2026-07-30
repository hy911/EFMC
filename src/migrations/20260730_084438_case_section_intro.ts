import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "case_studies_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_highlights_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "case_studies_blocks_case_split_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "case_studies_blocks_case_steps_steps" ADD COLUMN "image_id" integer;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ADD COLUMN "proof_value" varchar;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ADD COLUMN "proof_note" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "case_studies_highlights" ADD CONSTRAINT "case_studies_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_highlights_locales" ADD CONSTRAINT "case_studies_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_highlights"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_highlights_order_idx" ON "case_studies_highlights" USING btree ("_order");
  CREATE INDEX "case_studies_highlights_parent_id_idx" ON "case_studies_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_highlights_locales_locale_parent_id_unique" ON "case_studies_highlights_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "case_studies_blocks_case_steps_steps" ADD CONSTRAINT "case_studies_blocks_case_steps_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_steps_steps_image_idx" ON "case_studies_blocks_case_steps_steps" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_highlights_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "case_studies_highlights" CASCADE;
  DROP TABLE "case_studies_highlights_locales" CASCADE;
  ALTER TABLE "case_studies_blocks_case_steps_steps" DROP CONSTRAINT "case_studies_blocks_case_steps_steps_image_id_media_id_fk";
  
  DROP INDEX "case_studies_blocks_case_steps_steps_image_idx";
  ALTER TABLE "case_studies_blocks_case_split_locales" DROP COLUMN "intro";
  ALTER TABLE "case_studies_blocks_case_cards_locales" DROP COLUMN "intro";
  ALTER TABLE "case_studies_blocks_case_steps_steps" DROP COLUMN "image_id";
  ALTER TABLE "case_studies_blocks_case_steps_locales" DROP COLUMN "intro";
  ALTER TABLE "case_studies_blocks_case_steps_locales" DROP COLUMN "proof_value";
  ALTER TABLE "case_studies_blocks_case_steps_locales" DROP COLUMN "proof_note";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "intro";
  ALTER TABLE "case_studies_blocks_case_statement_locales" DROP COLUMN "intro";`)
}
