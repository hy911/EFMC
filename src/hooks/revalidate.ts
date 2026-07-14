import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { routing } from '@/i18n/routing'

/**
 * ISR 按需刷新：运营在后台保存内容后，立即让相关路径重新生成，
 * 无需等 revalidate 周期。Payload 与 Next 同进程，直接调 revalidatePath。
 *
 * 注意：独立脚本（seed）里没有 Next 请求上下文，revalidatePath 会抛错，
 * 统一 try/catch 吞掉 —— 刷新失败最多等下一个 ISR 周期，绝不影响写库。
 */

const safeRevalidate = (paths: string[]) => {
  try {
    paths.forEach((p) => revalidatePath(p))
  } catch {
    // 非 Next 运行时（seed / CLI），忽略
  }
}

/** 所有语种的同一路径（path 不带语言前缀，'' 表示首页） */
const allLocales = (path: string) => routing.locales.map((l) => `/${l}${path}`)

/** 产品：产品详情页 + 首页（精选区/页脚） */
export const revalidateProduct: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const slugs = new Set([doc?.slug, previousDoc?.slug].filter(Boolean) as string[])
  safeRevalidate([
    ...allLocales(''),
    ...[...slugs].flatMap((s) => allLocales(`/products/${s}`)),
  ])
  return doc
}
export const revalidateProductDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidate([...allLocales(''), ...allLocales(`/products/${doc?.slug}`)])
  return doc
}

/** 固定页：对应 slug 页面 */
export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const slugs = new Set([doc?.slug, previousDoc?.slug].filter(Boolean) as string[])
  safeRevalidate([...slugs].flatMap((s) => allLocales(`/${s}`)))
  return doc
}
export const revalidatePageDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidate(allLocales(`/${doc?.slug}`))
  return doc
}

/** 应用行业 / 证书：影响首页与固定页（证书墙） */
export const revalidateHome: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate(allLocales(''))
  return doc
}

/** 站点设置：全站布局都引用，刷新首页（其余页面等 ISR 周期） */
export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate(allLocales(''))
  return doc
}
