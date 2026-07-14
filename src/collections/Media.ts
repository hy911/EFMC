import path from 'path'
import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'

/**
 * 媒体库 —— 一期使用 Payload 本地存储（uploads/ 目录，部署时挂 Docker 卷）。
 * 上传的图片自动转 WebP 并生成多尺寸，前端按用途取对应 size。
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { en: 'Media', zh: '媒体' }, plural: { en: 'Media', zh: '媒体库' } },
  access: {
    read: anyone, // 图片文件公开可读
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      label: { en: 'Alt Text', zh: '替代文本（Alt）' },
      type: 'text',
      required: true,
      localized: true, // 图片 alt 分语种维护（SEO 要求）
    },
  ],
  upload: {
    // 存储目录：锚定进程工作目录（dev = 项目根，Docker standalone = /app），
    // 生产环境把 /app/uploads 挂为持久化卷；.gitignore 已排除
    staticDir: path.resolve(process.cwd(), 'uploads'),
    // 统一转 WebP：质量 80 在体积与画质间平衡
    formatOptions: { format: 'webp', options: { quality: 80 } },
    imageSizes: [
      // 卡片缩略图（产品/行业卡片）
      {
        name: 'card',
        width: 640,
        height: 480,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      // 内容区大图（Hero、页面配图）
      {
        name: 'feature',
        width: 1280,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      // OG 分享图（1200×630 是社交平台标准）
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    // 后台列表缩略图
    adminThumbnail: 'card',
    mimeTypes: ['image/*'],
  },
}
