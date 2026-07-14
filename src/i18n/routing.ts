import { defineRouting } from 'next-intl/routing'

/**
 * UI 层多语言路由配置（next-intl）。
 *
 * 注意与 Payload 的内容级 localization 区分：
 * - 这里管 URL（/en /zh）和界面文案（导航、按钮、表单标签）
 * - Payload localization 管业务内容（产品、页面正文），配置在 payload.config.ts
 *
 * 二期扩语种时：在 locales 里追加（如 'es' | 'ru' | 'ar'），
 * 同时在 payload.config.ts 的 localization.locales 中同步追加。
 */
export const routing = defineRouting({
  // 一期只做英文 + 中文
  locales: ['en', 'zh'],
  // 默认英文（面向海外 B2B 客户）
  defaultLocale: 'en',
  // URL 始终带语言前缀（/en/... /zh/...），对 hreflang 和 CDN 缓存最友好
  localePrefix: 'always',
})

/** 语种类型（type-safe，供全站复用） */
export type Locale = (typeof routing.locales)[number]
