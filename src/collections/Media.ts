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
  admin: {
    // 媒体库是「按图找图」，翻页找比滚动找累得多；默认一页 50 条
    pagination: { defaultLimit: 50, limits: [20, 50, 100] },
    // 创建时间对选图没帮助，去掉给文件名和 alt 让位
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
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
    {
      /**
       * 原始文件字节的 sha256（转 WebP 之前）。导入脚本上传前先算好、
       * 拿它查一次库：命中就复用已有的 media，不再传一份副本。
       * 没有它的时候，反复 --replace 会让同一张图在库里堆七八份
       * （曾经 212 张里 76 张是这么来的）。
       */
      name: 'contentHash',
      label: { en: 'Content Hash', zh: '内容指纹' },
      type: 'text',
      index: true, // 每次上传都要按它查一次，必须走索引
      admin: { readOnly: true, hidden: true }, // 机器用的字段，别占运营的视线
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
