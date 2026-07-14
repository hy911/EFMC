import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

/**
 * next-intl 服务端配置：按请求解析语种并加载对应的 UI 文案 JSON。
 * 未知语种统一回落到默认语言（en）。
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    // 按语种动态加载文案文件，避免把所有语言打进同一个 bundle
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
