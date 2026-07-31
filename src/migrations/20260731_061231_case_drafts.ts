import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_split_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_figure_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_figure_variant" AS ENUM('full', 'side');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_cards_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_cards_layout" AS ENUM('uniform', 'bento', 'metrics');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_steps_steps_pictogram" AS ENUM('none', 'ai', 'network');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_steps_steps_tone" AS ENUM('accent', 'flag', 'go', 'navy');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_steps_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_steps_style" AS ENUM('strip', 'flow', 'grid');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_compare_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_blocks_case_statement_theme" AS ENUM('auto', 'white', 'wash', 'washBlue', 'dark');
  CREATE TYPE "public"."enum__case_studies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_published_locale" AS ENUM('en', 'zh');
  ALTER TYPE "public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner" RENAME TO "enum_case_panel_tag_corner";
  CREATE TABLE "_case_studies_v_version_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_metrics_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_highlights_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_split_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_split_points_locales" (
  	"label" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_split_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_split_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"quote" varchar,
  	"quote_label" varchar,
  	"quote_footer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_figure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_figure_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"variant" "enum__case_studies_v_blocks_case_figure_variant" DEFAULT 'full',
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_figure_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"banner" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards_cards_locales" (
  	"tag" varchar,
  	"title" varchar,
  	"value" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards_facts_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_cards_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"layout" "enum__case_studies_v_blocks_case_cards_layout" DEFAULT 'uniform',
  	"side_image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_cards_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"side_image_label" varchar,
  	"side_image_value" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"pictogram" "enum__case_studies_v_blocks_case_steps_steps_pictogram" DEFAULT 'none',
  	"tone" "enum__case_studies_v_blocks_case_steps_steps_tone" DEFAULT 'accent',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_steps_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_steps_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"style" "enum__case_studies_v_blocks_case_steps_style" DEFAULT 'strip',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_steps_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"cell_label" varchar,
  	"proof_value" varchar,
  	"proof_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_rows_locales" (
  	"area" varchar,
  	"before" varchar,
  	"after" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_before_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_before_rows_locales" (
  	"symbol" varchar,
  	"text" varchar,
  	"note" varchar,
  	"tag" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_image_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"corner" "enum_case_panel_tag_corner" DEFAULT 'bottomLeft',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_image_tags_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_after_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"highlight" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_panel_after_facts_locales" (
  	"label" varchar,
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_compare_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"panel_image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_compare_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"label_area" varchar,
  	"label_before" varchar,
  	"label_after" varchar,
  	"panel_before_label" varchar,
  	"panel_before_title" varchar,
  	"panel_before_result_label" varchar,
  	"panel_before_result_value" varchar,
  	"panel_after_label" varchar,
  	"panel_after_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__case_studies_v_blocks_case_statement_theme" DEFAULT 'auto',
  	"theme_image_id" integer,
  	"accent_edge" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_case_statement_locales" (
  	"kicker" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"body" varchar,
  	"statement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_cover_image_id" integer,
  	"version_industry_id" integer,
  	"version_completed_at" timestamp(3) with time zone,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__case_studies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__case_studies_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_case_studies_v_locales" (
  	"version_title" varchar,
  	"version_title_accent" varchar,
  	"version_excerpt" varchar,
  	"version_location" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "case_studies_metrics_locales" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "case_studies_metrics_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "case_studies_highlights_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_points_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_points_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_steps_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_steps_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "area" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "before" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "after" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" ALTER COLUMN "symbol" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_area" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_before" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_after" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "kicker" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "statement" DROP NOT NULL;
  ALTER TABLE "case_studies" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "case_studies" ALTER COLUMN "cover_image_id" DROP NOT NULL;
  ALTER TABLE "case_studies_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "case_studies_locales" ALTER COLUMN "excerpt" DROP NOT NULL;
  ALTER TABLE "case_studies" ADD COLUMN "_status" "enum_case_studies_status" DEFAULT 'draft';
  ALTER TABLE "_case_studies_v_version_metrics" ADD CONSTRAINT "_case_studies_v_version_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_metrics_locales" ADD CONSTRAINT "_case_studies_v_version_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_highlights" ADD CONSTRAINT "_case_studies_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_highlights_locales" ADD CONSTRAINT "_case_studies_v_version_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_split_points" ADD CONSTRAINT "_case_studies_v_blocks_case_split_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_split_points_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_split_points_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_split_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_split" ADD CONSTRAINT "_case_studies_v_blocks_case_split_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_split" ADD CONSTRAINT "_case_studies_v_blocks_case_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_split_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_split_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_figure" ADD CONSTRAINT "_case_studies_v_blocks_case_figure_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_figure" ADD CONSTRAINT "_case_studies_v_blocks_case_figure_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_figure" ADD CONSTRAINT "_case_studies_v_blocks_case_figure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_figure_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_figure_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_figure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_cards" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_cards" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_cards_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_cards_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_facts" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_facts_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_facts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_cards_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_side_image_id_media_id_fk" FOREIGN KEY ("side_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_cards_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps_steps" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps_steps" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps_steps_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_steps_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_steps_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_rows" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_rows_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_rows_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_before_rows" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_before_rows_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_before_rows" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_before_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_before_rows_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_before_rows_loc_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare_panel_before_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_image_tags" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_image_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_image_tags_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_image_tags_loca_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare_panel_image_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_after_facts" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_after_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_after_facts_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_after_facts_loc_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare_panel_after_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_panel_image_id_media_id_fk" FOREIGN KEY ("panel_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_compare_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_compare_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_statement" ADD CONSTRAINT "_case_studies_v_blocks_case_statement_theme_image_id_media_id_fk" FOREIGN KEY ("theme_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_statement" ADD CONSTRAINT "_case_studies_v_blocks_case_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_statement_locales" ADD CONSTRAINT "_case_studies_v_blocks_case_statement_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_case_statement"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_industry_id_application_scenarios_id_fk" FOREIGN KEY ("version_industry_id") REFERENCES "public"."application_scenarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_locales" ADD CONSTRAINT "_case_studies_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_case_studies_v_version_metrics_order_idx" ON "_case_studies_v_version_metrics" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_metrics_parent_id_idx" ON "_case_studies_v_version_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_metrics_locales_locale_parent_id_uni" ON "_case_studies_v_version_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_version_highlights_order_idx" ON "_case_studies_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_highlights_parent_id_idx" ON "_case_studies_v_version_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_highlights_locales_locale_parent_id_" ON "_case_studies_v_version_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_split_points_order_idx" ON "_case_studies_v_blocks_case_split_points" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_split_points_parent_id_idx" ON "_case_studies_v_blocks_case_split_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_split_points_locales_locale_pare" ON "_case_studies_v_blocks_case_split_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_split_order_idx" ON "_case_studies_v_blocks_case_split" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_split_parent_id_idx" ON "_case_studies_v_blocks_case_split" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_split_path_idx" ON "_case_studies_v_blocks_case_split" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_split_theme_image_idx" ON "_case_studies_v_blocks_case_split" USING btree ("theme_image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_split_locales_locale_parent_id_u" ON "_case_studies_v_blocks_case_split_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_figure_order_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_figure_parent_id_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_figure_path_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_figure_theme_image_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("theme_image_id");
  CREATE INDEX "_case_studies_v_blocks_case_figure_image_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_figure_locales_locale_parent_id_" ON "_case_studies_v_blocks_case_figure_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_cards_order_idx" ON "_case_studies_v_blocks_case_cards_cards" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_cards_cards_parent_id_idx" ON "_case_studies_v_blocks_case_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_cards_image_idx" ON "_case_studies_v_blocks_case_cards_cards" USING btree ("image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_cards_cards_locales_locale_paren" ON "_case_studies_v_blocks_case_cards_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_facts_order_idx" ON "_case_studies_v_blocks_case_cards_facts" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_cards_facts_parent_id_idx" ON "_case_studies_v_blocks_case_cards_facts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_cards_facts_locales_locale_paren" ON "_case_studies_v_blocks_case_cards_facts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_order_idx" ON "_case_studies_v_blocks_case_cards" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_cards_parent_id_idx" ON "_case_studies_v_blocks_case_cards" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_path_idx" ON "_case_studies_v_blocks_case_cards" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_cards_theme_image_idx" ON "_case_studies_v_blocks_case_cards" USING btree ("theme_image_id");
  CREATE INDEX "_case_studies_v_blocks_case_cards_side_image_idx" ON "_case_studies_v_blocks_case_cards" USING btree ("side_image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_cards_locales_locale_parent_id_u" ON "_case_studies_v_blocks_case_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_steps_steps_order_idx" ON "_case_studies_v_blocks_case_steps_steps" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_steps_steps_parent_id_idx" ON "_case_studies_v_blocks_case_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_steps_steps_image_idx" ON "_case_studies_v_blocks_case_steps_steps" USING btree ("image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_steps_steps_locales_locale_paren" ON "_case_studies_v_blocks_case_steps_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_steps_order_idx" ON "_case_studies_v_blocks_case_steps" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_steps_parent_id_idx" ON "_case_studies_v_blocks_case_steps" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_steps_path_idx" ON "_case_studies_v_blocks_case_steps" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_steps_theme_image_idx" ON "_case_studies_v_blocks_case_steps" USING btree ("theme_image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_steps_locales_locale_parent_id_u" ON "_case_studies_v_blocks_case_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_rows_order_idx" ON "_case_studies_v_blocks_case_compare_rows" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_compare_rows_parent_id_idx" ON "_case_studies_v_blocks_case_compare_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_compare_rows_locales_locale_pare" ON "_case_studies_v_blocks_case_compare_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_before_rows_order_idx" ON "_case_studies_v_blocks_case_compare_panel_before_rows" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_before_rows_parent_id_idx" ON "_case_studies_v_blocks_case_compare_panel_before_rows" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_before_rows_im_idx" ON "_case_studies_v_blocks_case_compare_panel_before_rows" USING btree ("image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_compare_panel_before_rows_locale" ON "_case_studies_v_blocks_case_compare_panel_before_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_image_tags_order_idx" ON "_case_studies_v_blocks_case_compare_panel_image_tags" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_image_tags_parent_id_idx" ON "_case_studies_v_blocks_case_compare_panel_image_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_compare_panel_image_tags_local_1" ON "_case_studies_v_blocks_case_compare_panel_image_tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_after_facts_order_idx" ON "_case_studies_v_blocks_case_compare_panel_after_facts" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_after_facts_parent_id_idx" ON "_case_studies_v_blocks_case_compare_panel_after_facts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_compare_panel_after_facts_locale" ON "_case_studies_v_blocks_case_compare_panel_after_facts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_order_idx" ON "_case_studies_v_blocks_case_compare" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_compare_parent_id_idx" ON "_case_studies_v_blocks_case_compare" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_path_idx" ON "_case_studies_v_blocks_case_compare" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_compare_theme_image_idx" ON "_case_studies_v_blocks_case_compare" USING btree ("theme_image_id");
  CREATE INDEX "_case_studies_v_blocks_case_compare_panel_image_idx" ON "_case_studies_v_blocks_case_compare" USING btree ("panel_image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_compare_locales_locale_parent_id" ON "_case_studies_v_blocks_case_compare_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_statement_order_idx" ON "_case_studies_v_blocks_case_statement" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_case_statement_parent_id_idx" ON "_case_studies_v_blocks_case_statement" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_case_statement_path_idx" ON "_case_studies_v_blocks_case_statement" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_case_statement_theme_image_idx" ON "_case_studies_v_blocks_case_statement" USING btree ("theme_image_id");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_case_statement_locales_locale_parent_" ON "_case_studies_v_blocks_case_statement_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_parent_idx" ON "_case_studies_v" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_version_slug_idx" ON "_case_studies_v" USING btree ("version_slug");
  CREATE INDEX "_case_studies_v_version_version_cover_image_idx" ON "_case_studies_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_case_studies_v_version_version_industry_idx" ON "_case_studies_v" USING btree ("version_industry_id");
  CREATE INDEX "_case_studies_v_version_seo_version_seo_og_image_idx" ON "_case_studies_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_case_studies_v_version_version_updated_at_idx" ON "_case_studies_v" USING btree ("version_updated_at");
  CREATE INDEX "_case_studies_v_version_version_created_at_idx" ON "_case_studies_v" USING btree ("version_created_at");
  CREATE INDEX "_case_studies_v_version_version__status_idx" ON "_case_studies_v" USING btree ("version__status");
  CREATE INDEX "_case_studies_v_created_at_idx" ON "_case_studies_v" USING btree ("created_at");
  CREATE INDEX "_case_studies_v_updated_at_idx" ON "_case_studies_v" USING btree ("updated_at");
  CREATE INDEX "_case_studies_v_snapshot_idx" ON "_case_studies_v" USING btree ("snapshot");
  CREATE INDEX "_case_studies_v_published_locale_idx" ON "_case_studies_v" USING btree ("published_locale");
  CREATE INDEX "_case_studies_v_latest_idx" ON "_case_studies_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_case_studies_v_locales_locale_parent_id_unique" ON "_case_studies_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_rels_order_idx" ON "_case_studies_v_rels" USING btree ("order");
  CREATE INDEX "_case_studies_v_rels_parent_idx" ON "_case_studies_v_rels" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_rels_path_idx" ON "_case_studies_v_rels" USING btree ("path");
  CREATE INDEX "_case_studies_v_rels_products_id_idx" ON "_case_studies_v_rels" USING btree ("products_id");
  CREATE INDEX "case_studies__status_idx" ON "case_studies" USING btree ("_status");`)

  /*
    手工补的一步，别删。
    上面 ADD COLUMN "_status" 带的是 DEFAULT 'draft'，而 Postgres 11+ 的
    ADD COLUMN … DEFAULT 会把现有行一并填上这个默认值 —— 也就是说迁移一跑，
    库里所有已经上线的案例瞬间变成「草稿」，前台按已发布筛选后直接空掉。
    开草稿之前就存在的内容，一律视为已发布。
  */
  await db.execute(sql`
  UPDATE "case_studies" SET "_status" = 'published' WHERE "_status" IS DISTINCT FROM 'published';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner" AS ENUM('bottomLeft', 'topRight', 'topLeft');
  ALTER TABLE "_case_studies_v_version_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_split_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_split_points_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_split" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_split_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_figure" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_figure_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards_facts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_steps_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_before_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_before_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_image_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_image_tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_after_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_panel_after_facts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_compare_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_statement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_blocks_case_statement_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_case_studies_v_version_metrics" CASCADE;
  DROP TABLE "_case_studies_v_version_metrics_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_highlights" CASCADE;
  DROP TABLE "_case_studies_v_version_highlights_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_split_points" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_split_points_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_split" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_split_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_figure" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_figure_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards_cards" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards_cards_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards_facts" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards_facts_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_cards_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_steps_steps" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_steps_steps_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_steps" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_steps_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_rows" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_rows_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_before_rows" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_before_rows_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_image_tags" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_image_tags_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_after_facts" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_panel_after_facts_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_compare_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_statement" CASCADE;
  DROP TABLE "_case_studies_v_blocks_case_statement_locales" CASCADE;
  DROP TABLE "_case_studies_v" CASCADE;
  DROP TABLE "_case_studies_v_locales" CASCADE;
  DROP TABLE "_case_studies_v_rels" CASCADE;
  DROP INDEX "case_studies__status_idx";
  ALTER TABLE "case_studies_metrics_locales" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "case_studies_metrics_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "case_studies_highlights_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_points_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_points_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_split_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_figure_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_cards_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_facts_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_cards_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_steps_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_steps_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_steps_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "area" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "before" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_rows_locales" ALTER COLUMN "after" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" ALTER COLUMN "symbol" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_before_rows_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags" ALTER COLUMN "corner" DROP DEFAULT;
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags" ALTER COLUMN "corner" SET DATA TYPE "public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner" USING "corner"::text::"public"."enum_case_studies_blocks_case_compare_panel_image_tags_corner";
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags" ALTER COLUMN "corner" SET DEFAULT 'bottomLeft';
  ALTER TABLE "case_studies_blocks_case_compare_panel_image_tags_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_panel_after_facts_locales" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_area" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_before" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_compare_locales" ALTER COLUMN "label_after" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "kicker" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "case_studies_blocks_case_statement_locales" ALTER COLUMN "statement" SET NOT NULL;
  ALTER TABLE "case_studies" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "case_studies" ALTER COLUMN "cover_image_id" SET NOT NULL;
  ALTER TABLE "case_studies_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "case_studies_locales" ALTER COLUMN "excerpt" SET NOT NULL;
  ALTER TABLE "case_studies" DROP COLUMN "_status";
  DROP TYPE "public"."enum_case_panel_tag_corner";
  DROP TYPE "public"."enum_case_studies_status";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_split_theme";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_figure_theme";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_figure_variant";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_cards_theme";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_cards_layout";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_steps_steps_pictogram";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_steps_steps_tone";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_steps_theme";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_steps_style";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_compare_theme";
  DROP TYPE "public"."enum__case_studies_v_blocks_case_statement_theme";
  DROP TYPE "public"."enum__case_studies_v_version_status";
  DROP TYPE "public"."enum__case_studies_v_published_locale";`)
}
