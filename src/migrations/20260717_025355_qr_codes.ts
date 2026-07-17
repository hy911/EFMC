import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "contact_wechat_qr_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "contact_whats_app_qr_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_contact_wechat_qr_id_media_id_fk" FOREIGN KEY ("contact_wechat_qr_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_contact_whats_app_qr_id_media_id_fk" FOREIGN KEY ("contact_whats_app_qr_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_contact_contact_wechat_qr_idx" ON "site_settings" USING btree ("contact_wechat_qr_id");
  CREATE INDEX "site_settings_contact_contact_whats_app_qr_idx" ON "site_settings" USING btree ("contact_whats_app_qr_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_contact_wechat_qr_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_contact_whats_app_qr_id_media_id_fk";
  
  DROP INDEX "site_settings_contact_contact_wechat_qr_idx";
  DROP INDEX "site_settings_contact_contact_whats_app_qr_idx";
  ALTER TABLE "site_settings" DROP COLUMN "contact_wechat_qr_id";
  ALTER TABLE "site_settings" DROP COLUMN "contact_whats_app_qr_id";`)
}
