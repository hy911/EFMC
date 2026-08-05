import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "content_hash" varchar;
  CREATE INDEX "media_content_hash_idx" ON "media" USING btree ("content_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_content_hash_idx";
  ALTER TABLE "media" DROP COLUMN "content_hash";`)
}
