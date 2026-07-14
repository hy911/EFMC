import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ApplicationScenarios } from './collections/ApplicationScenarios'
import { Certificates } from './collections/Certificates'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { ProductCategories } from './collections/ProductCategories'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Donglin Controls',
    },
  },
  collections: [
    // 产品目录
    Products,
    ProductCategories,
    ApplicationScenarios,
    // 内容
    Pages,
    Certificates,
    // 线索
    Inquiries,
    // 系统
    Media,
    Users,
  ],
  globals: [SiteSettings],
  /**
   * 内容级多语言（与 next-intl 的 UI 文案分层）：
   * - 运营在后台切语言编辑产品/页面正文
   * - fallback: true —— zh 未翻译的字段自动回落 en，保证页面永不缺内容
   * - 二期扩语种：在 locales 追加（RTL 语种带 rtl: true），
   *   并同步更新 src/i18n/routing.ts
   */
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '简体中文', code: 'zh' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
