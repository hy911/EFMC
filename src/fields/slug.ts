import type { FieldHook, TextField } from 'payload'

/** 把任意标题转成 URL 友好的 slug（仅小写字母/数字/连字符） */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-') // 非字母数字统一转 -
    .replace(/^-+|-+$/g, '') // 去掉首尾 -

/**
 * beforeValidate hook：slug 为空时根据来源字段（默认 title）自动生成。
 * slug 不做 localized —— 同一条内容各语种共用一个 URL 路径，
 * 语言差异由 /en /zh 前缀表达（对 hreflang 互链最简单可靠）。
 */
const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) {
      return slugify(value)
    }
    const fallback = data?.[fallbackField]
    if (typeof fallback === 'string' && fallback.length > 0) {
      return slugify(fallback)
    }
    return value
  }

/** 可复用的 slug 字段工厂：slugField('title') */
export const slugField = (fallbackField = 'title'): TextField => ({
  name: 'slug',
  label: { en: 'Slug', zh: 'URL 标识（slug）' },
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description: {
      en: 'URL path segment. Auto-generated from the title if left empty.',
      zh: 'URL 路径片段；留空时根据标题自动生成。',
    },
  },
  hooks: {
    beforeValidate: [formatSlugHook(fallbackField)],
  },
})
