import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner" AS ENUM('bottomLeft', 'topRight', 'topLeft');
  CREATE TABLE "case_studies_blocks_case_cards_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_cards_facts_locales" (
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_before_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" (
  	"symbol" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"note" varchar,
  	"tag" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_image_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"corner" "enum_case_studies_blocks_case_compare_panel_image_tags_corner" DEFAULT 'bottomLeft'
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_after_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" (
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "case_studies_blocks_case_cards_locales" ADD COLUMN "note" varchar;
  ALTER TABLE "case_studies_blocks_case_compare" ADD COLUMN "panel_image_id" integer;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_before_label" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_before_title" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_before_result_label" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_before_result_value" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_after_label" varchar;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD COLUMN "panel_after_title" varchar;
  ALTER TABLE "case_studies_blocks_case_cards_facts" ADD CONSTRAINT "case_studies_blocks_case_cards_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" ADD CONSTRAINT "case_studies_blocks_case_cards_facts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_cards_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_before_rows_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_before_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_before_rows_locale_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare_panel_before_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_image_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_image_tags_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare_panel_image_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_after_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_after_facts_locale_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare_panel_after_facts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_cards_facts_order_idx" ON "case_studies_blocks_case_cards_facts" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_cards_facts_parent_id_idx" ON "case_studies_blocks_case_cards_facts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_cards_facts_locales_locale_parent_i" ON "case_studies_blocks_case_cards_facts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_panel_before_rows_order_idx" ON "case_studies_blocks_case_compare_panel_before_rows" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_compare_panel_before_rows_parent_id_idx" ON "case_studies_blocks_case_compare_panel_before_rows" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_panel_before_rows_image_idx" ON "case_studies_blocks_case_compare_panel_before_rows" USING btree ("image_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_compare_panel_before_rows_locales_l" ON "case_studies_blocks_case_compare_panel_before_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_panel_image_tags_order_idx" ON "case_studies_blocks_case_compare_panel_image_tags" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_compare_panel_image_tags_parent_id_idx" ON "case_studies_blocks_case_compare_panel_image_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_compare_panel_image_tags_locales_lo" ON "case_studies_blocks_case_compare_panel_image_tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_panel_after_facts_order_idx" ON "case_studies_blocks_case_compare_panel_after_facts" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_compare_panel_after_facts_parent_id_idx" ON "case_studies_blocks_case_compare_panel_after_facts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_compare_panel_after_facts_locales_l" ON "case_studies_blocks_case_compare_panel_after_facts_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "case_studies_blocks_case_compare" ADD CONSTRAINT "case_studies_blocks_case_compare_panel_image_id_media_id_fk" FOREIGN KEY ("panel_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_compare_panel_image_idx" ON "case_studies_blocks_case_compare" USING btree ("panel_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_cards_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "case_studies_blocks_case_cards_facts" CASCADE;
  DROP TABLE "case_studies_blocks_case_cards_facts_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_before_rows" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_image_tags" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_after_facts" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" CASCADE;
  ALTER TABLE "case_studies_blocks_case_compare" DROP CONSTRAINT "case_studies_blocks_case_compare_panel_image_id_media_id_fk";
  
  DROP INDEX "case_studies_blocks_case_compare_panel_image_idx";
  ALTER TABLE "case_studies_blocks_case_cards_locales" DROP COLUMN "note";
  ALTER TABLE "case_studies_blocks_case_compare" DROP COLUMN "panel_image_id";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_before_label";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_before_title";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_before_result_label";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_before_result_value";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_after_label";
  ALTER TABLE "case_studies_blocks_case_compare_locales" DROP COLUMN "panel_after_title";
  DROP TYPE "public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner";`)
}
