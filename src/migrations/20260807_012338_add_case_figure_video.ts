import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_figure" ADD COLUMN "video_id" integer;
  ALTER TABLE "_case_studies_v_blocks_case_figure" ADD COLUMN "video_id" integer;
  ALTER TABLE "case_studies_blocks_case_figure" ADD CONSTRAINT "case_studies_blocks_case_figure_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_case_figure" ADD CONSTRAINT "_case_studies_v_blocks_case_figure_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_blocks_case_figure_video_idx" ON "case_studies_blocks_case_figure" USING btree ("video_id");
  CREATE INDEX "_case_studies_v_blocks_case_figure_video_idx" ON "_case_studies_v_blocks_case_figure" USING btree ("video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_blocks_case_figure" DROP CONSTRAINT "case_studies_blocks_case_figure_video_id_media_id_fk";
  
  ALTER TABLE "_case_studies_v_blocks_case_figure" DROP CONSTRAINT "_case_studies_v_blocks_case_figure_video_id_media_id_fk";
  
  DROP INDEX "case_studies_blocks_case_figure_video_idx";
  DROP INDEX "_case_studies_v_blocks_case_figure_video_idx";
  ALTER TABLE "case_studies_blocks_case_figure" DROP COLUMN "video_id";
  ALTER TABLE "_case_studies_v_blocks_case_figure" DROP COLUMN "video_id";`)
}
