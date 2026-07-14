import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { pageBlocks } from '@/blocks'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'

/**
 * 固定页（About、工厂实力、Contact 等）—— 用灵活 blocks 拼装布局，
 * 前端路由 /[locale]/[slug] 渲染。
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: { en: 'Page', zh: '页面' }, plural: { en: 'Pages', zh: '固定页面' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: { en: 'Content', zh: '内容管理' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', zh: '页面标题' },
      type: 'text',
      required: true,
      localized: true,
    },
    slugField('title'),
    {
      name: 'intro',
      label: { en: 'Intro', zh: '导语' },
      type: 'textarea',
      localized: true,
      admin: {
        description: { en: 'Shown under the page title.', zh: '显示在页面大标题下方，可留空。' },
      },
    },
    {
      name: 'layout',
      label: { en: 'Layout', zh: '页面布局' },
      type: 'blocks',
      blocks: pageBlocks,
    },
    seoField,
  ],
}
