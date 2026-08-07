import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Docker 部署：产出自包含的 standalone server（node server.js 直接运行）
  output: 'standalone',
  images: {
    // 默认 75 对照片够用；90 留给案例页的架构/对比示意图 ——
    // 细线和小字在 75 的 WebP 下会出现明显噪点（Next 16 要求白名单声明）
    qualities: [75, 90],
    localPatterns: [
      {
        // Payload 媒体库文件
        pathname: '/api/media/file/**',
      },
      {
        // 仓库内静态图片（logo、hero 占位图）
        pathname: '/images/**',
      },
    ],
  },
  /**
   * 把浏览器控制台的报错转发到 dev 终端。
   *
   * 客户端的报错只出现在浏览器里，而写代码的 AI 看的是终端输出 —— 不转发的话
   * 它拿不到自己被要求修的那个错。设 'error' 不设 true：全量转发会把
   * React 的各种开发提示也刷进来，真正的报错反而淹掉。
   *
   * 只影响 next dev，生产构建不带。
   */
  logging: { browserToTerminal: 'error' },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

// next-intl 插件：指向服务端请求配置（按语种加载 UI 文案）
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// 两个插件组合：Payload 嵌入 + next-intl
export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
