import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/**
 * 语言感知的导航 API：全站必须用这里导出的 Link / redirect 等，
 * 而不是 next/link、next/navigation 的原始版本 ——
 * 它们会自动带上当前语言前缀（/en /zh）。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
