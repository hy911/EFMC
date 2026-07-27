import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_feature_columns_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_columns_columns_items_locales" (
  	"label" varchar,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_columns_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_columns_columns_locales" (
  	"kicker" varchar,
  	"title" varchar NOT NULL,
  	"footnote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_columns_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_logo_strip_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_logo_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_strip_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_home_advantage_columns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_home_advantage_columns_items_locales" (
  	"label" varchar,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_home_advantage_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_home_advantage_columns_locales" (
  	"kicker" varchar,
  	"title" varchar NOT NULL,
  	"footnote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_advantage_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_advantage_heading" varchar;
  ALTER TABLE "pages_blocks_feature_columns_columns_items" ADD CONSTRAINT "pages_blocks_feature_columns_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_columns_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_columns_columns_items_locales" ADD CONSTRAINT "pages_blocks_feature_columns_columns_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_columns_columns_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_columns_columns" ADD CONSTRAINT "pages_blocks_feature_columns_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_columns_columns_locales" ADD CONSTRAINT "pages_blocks_feature_columns_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_columns_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_columns" ADD CONSTRAINT "pages_blocks_feature_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_columns_locales" ADD CONSTRAINT "pages_blocks_feature_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip_logos" ADD CONSTRAINT "pages_blocks_logo_strip_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip_logos" ADD CONSTRAINT "pages_blocks_logo_strip_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip" ADD CONSTRAINT "pages_blocks_logo_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip_locales" ADD CONSTRAINT "pages_blocks_logo_strip_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_advantage_columns_items" ADD CONSTRAINT "site_settings_home_advantage_columns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_advantage_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_advantage_columns_items_locales" ADD CONSTRAINT "site_settings_home_advantage_columns_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_advantage_columns_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_advantage_columns" ADD CONSTRAINT "site_settings_home_advantage_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_advantage_columns_locales" ADD CONSTRAINT "site_settings_home_advantage_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_advantage_columns"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_feature_columns_columns_items_order_idx" ON "pages_blocks_feature_columns_columns_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_columns_columns_items_parent_id_idx" ON "pages_blocks_feature_columns_columns_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_feature_columns_columns_items_locales_locale_pa" ON "pages_blocks_feature_columns_columns_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_columns_columns_order_idx" ON "pages_blocks_feature_columns_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_columns_columns_parent_id_idx" ON "pages_blocks_feature_columns_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_feature_columns_columns_locales_locale_parent_i" ON "pages_blocks_feature_columns_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_columns_order_idx" ON "pages_blocks_feature_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_columns_parent_id_idx" ON "pages_blocks_feature_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_columns_path_idx" ON "pages_blocks_feature_columns" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_feature_columns_locales_locale_parent_id_unique" ON "pages_blocks_feature_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_logos_order_idx" ON "pages_blocks_logo_strip_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_logos_parent_id_idx" ON "pages_blocks_logo_strip_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_logos_image_idx" ON "pages_blocks_logo_strip_logos" USING btree ("image_id");
  CREATE INDEX "pages_blocks_logo_strip_order_idx" ON "pages_blocks_logo_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_parent_id_idx" ON "pages_blocks_logo_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_path_idx" ON "pages_blocks_logo_strip" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_logo_strip_locales_locale_parent_id_unique" ON "pages_blocks_logo_strip_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_home_advantage_columns_items_order_idx" ON "site_settings_home_advantage_columns_items" USING btree ("_order");
  CREATE INDEX "site_settings_home_advantage_columns_items_parent_id_idx" ON "site_settings_home_advantage_columns_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_home_advantage_columns_items_locales_locale_pa" ON "site_settings_home_advantage_columns_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_home_advantage_columns_order_idx" ON "site_settings_home_advantage_columns" USING btree ("_order");
  CREATE INDEX "site_settings_home_advantage_columns_parent_id_idx" ON "site_settings_home_advantage_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_home_advantage_columns_locales_locale_parent_i" ON "site_settings_home_advantage_columns_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_feature_columns_columns_items" CASCADE;
  DROP TABLE "pages_blocks_feature_columns_columns_items_locales" CASCADE;
  DROP TABLE "pages_blocks_feature_columns_columns" CASCADE;
  DROP TABLE "pages_blocks_feature_columns_columns_locales" CASCADE;
  DROP TABLE "pages_blocks_feature_columns" CASCADE;
  DROP TABLE "pages_blocks_feature_columns_locales" CASCADE;
  DROP TABLE "pages_blocks_logo_strip_logos" CASCADE;
  DROP TABLE "pages_blocks_logo_strip" CASCADE;
  DROP TABLE "pages_blocks_logo_strip_locales" CASCADE;
  DROP TABLE "site_settings_home_advantage_columns_items" CASCADE;
  DROP TABLE "site_settings_home_advantage_columns_items_locales" CASCADE;
  DROP TABLE "site_settings_home_advantage_columns" CASCADE;
  DROP TABLE "site_settings_home_advantage_columns_locales" CASCADE;
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_advantage_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_advantage_heading";`)
}
