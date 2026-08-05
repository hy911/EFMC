import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ApplicationScenarios } from './collections/ApplicationScenarios'
import { CaseStudies } from './collections/CaseStudies'
import { Certificates } from './collections/Certificates'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
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
  /**
   * 后台**界面**语言（菜单、按钮、字段 label），与下方 localization 的
   * 内容语言是两回事：这里决定运营看到的界面是中文还是英文，
   * localization 决定在编辑哪个语种的内容。
   * 运营是中文使用者，故默认中文；中英两种都保留，个人可在 /admin/account 切换。
   *
   * supportedLanguages 必须显式声明：Payload 的默认值是 `{ en }` 一种，
   * 后台账号页的「语言」下拉就是照这个列的。而且 sanitize 时会检查
   * fallbackLanguage 在不在这个列表里，不在就悄悄退回列表第一项 ——
   * 只写 fallbackLanguage: 'zh' 而不加 zh，整条设置会被无声丢弃。
   *
   * 注意 fallbackLanguage 是**兜底**不是强制。Payload 的选择顺序是
   * 用户个人设置 → 浏览器 Accept-Language → 这里的 fallbackLanguage。
   * 所以浏览器语言偏好里英文排在中文前面的人，看到的仍是英文界面，
   * 需要自己去 /admin/account 切一次（切完存在用户偏好里，之后不用再切）。
   */
  i18n: {
    supportedLanguages: { en, zh },
    fallbackLanguage: 'zh',
  },
  collections: [
    // 产品目录
    Products,
    ProductCategories,
    ApplicationScenarios,
    // 内容
    Pages,
    CaseStudies,
    Posts,
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
  /**
   * Payload 系统邮件（后台用户忘记密码/验证等）：
   * 配了 RESEND_API_KEY 就走 Resend（与询盘通知共用一个 key），
   * 未配置时回落到控制台输出（本地开发态，启动时会有 WARN 提示属正常）。
   * 注意与 src/lib/notify.ts 的区别：询盘通知是业务邮件，独立直发，不走这里。
   */
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.INQUIRY_NOTIFY_FROM || 'noreply@example.com',
          defaultFromName: 'Donglin Controls',
        }),
      }
    : {}),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    /**
     * 测试里关掉 dev schema push。
     *
     * 测试跑在已经 migrate 过的库上，push 本来就是多余的；更麻烦的是每个测试
     * 文件都会各起一个 Payload 实例，几个 push 并发打同一个库，会撞
     * `constraint … does not exist`（42704）/ `already exists`（42710），
     * 表现为随机某个测试文件挂掉、加一个测试文件就翻车。
     * 顺带也让每次 init 快很多（不然 beforeAll 会顶到 vitest 的 10 秒上限）。
     */
    push: !process.env.VITEST,
  }),
  sharp,
  plugins: [],
})
