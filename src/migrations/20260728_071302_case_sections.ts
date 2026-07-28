import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "case_studies_blocks_case_split_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_split_points_locales" (
  	"label" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_split_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"quote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_figure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_figure_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"banner" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "case_studies_blocks_case_cards_cards_locales" (
  	"tag" varchar,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_cards_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_steps_steps_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_steps_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_rows_locales" (
  	"area" varchar NOT NULL,
  	"before" varchar NOT NULL,
  	"after" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_compare_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"label_area" varchar NOT NULL,
  	"label_before" varchar NOT NULL,
  	"label_after" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_case_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_case_statement_locales" (
  	"kicker" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"statement" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "case_studies_blocks_case_split_points" ADD CONSTRAINT "case_studies_blocks_case_split_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_split_points_locales" ADD CONSTRAINT "case_studies_blocks_case_split_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_split_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_split" ADD CONSTRAINT "case_studies_blocks_case_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_split_locales" ADD CONSTRAINT "case_studies_blocks_case_split_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_figure" ADD CONSTRAINT "case_studies_blocks_case_figure_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_figure" ADD CONSTRAINT "case_studies_blocks_case_figure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_figure_locales" ADD CONSTRAINT "case_studies_blocks_case_figure_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_figure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards_cards" ADD CONSTRAINT "case_studies_blocks_case_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards_cards" ADD CONSTRAINT "case_studies_blocks_case_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ADD CONSTRAINT "case_studies_blocks_case_cards_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_cards_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards" ADD CONSTRAINT "case_studies_blocks_case_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ADD CONSTRAINT "case_studies_blocks_case_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_steps_steps" ADD CONSTRAINT "case_studies_blocks_case_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_steps_steps_locales" ADD CONSTRAINT "case_studies_blocks_case_steps_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_steps_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_steps" ADD CONSTRAINT "case_studies_blocks_case_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ADD CONSTRAINT "case_studies_blocks_case_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_rows" ADD CONSTRAINT "case_studies_blocks_case_compare_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ADD CONSTRAINT "case_studies_blocks_case_compare_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare" ADD CONSTRAINT "case_studies_blocks_case_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ADD CONSTRAINT "case_studies_blocks_case_compare_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_statement" ADD CONSTRAINT "case_studies_blocks_case_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ADD CONSTRAINT "case_studies_blocks_case_statement_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_case_statement"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_split_points_order_idx" ON "case_studies_blocks_case_split_points" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_split_points_parent_id_idx" ON "case_studies_blocks_case_split_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_split_points_locales_locale_parent_" ON "case_studies_blocks_case_split_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_split_order_idx" ON "case_studies_blocks_case_split" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_split_parent_id_idx" ON "case_studies_blocks_case_split" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_split_path_idx" ON "case_studies_blocks_case_split" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_case_split_locales_locale_parent_id_uniq" ON "case_studies_blocks_case_split_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_figure_order_idx" ON "case_studies_blocks_case_figure" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_figure_parent_id_idx" ON "case_studies_blocks_case_figure" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_figure_path_idx" ON "case_studies_blocks_case_figure" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_case_figure_image_idx" ON "case_studies_blocks_case_figure" USING btree ("image_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_figure_locales_locale_parent_id_uni" ON "case_studies_blocks_case_figure_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_cards_cards_order_idx" ON "case_studies_blocks_case_cards_cards" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_cards_cards_parent_id_idx" ON "case_studies_blocks_case_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_cards_cards_image_idx" ON "case_studies_blocks_case_cards_cards" USING btree ("image_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_cards_cards_locales_locale_parent_i" ON "case_studies_blocks_case_cards_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_cards_order_idx" ON "case_studies_blocks_case_cards" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_cards_parent_id_idx" ON "case_studies_blocks_case_cards" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_cards_path_idx" ON "case_studies_blocks_case_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_case_cards_locales_locale_parent_id_uniq" ON "case_studies_blocks_case_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_steps_steps_order_idx" ON "case_studies_blocks_case_steps_steps" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_steps_steps_parent_id_idx" ON "case_studies_blocks_case_steps_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_steps_steps_locales_locale_parent_i" ON "case_studies_blocks_case_steps_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_steps_order_idx" ON "case_studies_blocks_case_steps" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_steps_parent_id_idx" ON "case_studies_blocks_case_steps" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_steps_path_idx" ON "case_studies_blocks_case_steps" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_case_steps_locales_locale_parent_id_uniq" ON "case_studies_blocks_case_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_rows_order_idx" ON "case_studies_blocks_case_compare_rows" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_compare_rows_parent_id_idx" ON "case_studies_blocks_case_compare_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_blocks_case_compare_rows_locales_locale_parent_" ON "case_studies_blocks_case_compare_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_order_idx" ON "case_studies_blocks_case_compare" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_compare_parent_id_idx" ON "case_studies_blocks_case_compare" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_compare_path_idx" ON "case_studies_blocks_case_compare" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_case_compare_locales_locale_parent_id_un" ON "case_studies_blocks_case_compare_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_case_statement_order_idx" ON "case_studies_blocks_case_statement" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_case_statement_parent_id_idx" ON "case_studies_blocks_case_statement" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_case_statement_path_idx" ON "case_studies_blocks_case_statement" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_case_statement_locales_locale_parent_id_" ON "case_studies_blocks_case_statement_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "case_studies_blocks_case_split_points" CASCADE;
  DROP TABLE "case_studies_blocks_case_split_points_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_split" CASCADE;
  DROP TABLE "case_studies_blocks_case_split_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_figure" CASCADE;
  DROP TABLE "case_studies_blocks_case_figure_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_cards_cards" CASCADE;
  DROP TABLE "case_studies_blocks_case_cards_cards_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_cards" CASCADE;
  DROP TABLE "case_studies_blocks_case_cards_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_steps_steps" CASCADE;
  DROP TABLE "case_studies_blocks_case_steps_steps_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_steps" CASCADE;
  DROP TABLE "case_studies_blocks_case_steps_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_rows" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_rows_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare" CASCADE;
  DROP TABLE "case_studies_blocks_case_compare_locales" CASCADE;
  DROP TABLE "case_studies_blocks_case_statement" CASCADE;
  DROP TABLE "case_studies_blocks_case_statement_locales" CASCADE;`)
}
