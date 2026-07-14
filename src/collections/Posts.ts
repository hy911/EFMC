import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidatePost, revalidatePostDelete } from '@/hooks/revalidate'

/**
 * 博客文章（二期）—— 行业知识内容，SEO 长尾流量入口。
 * 前端路由：/[locale]/blog 与 /[locale]/blog/[slug]，按发布时间倒序。
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: { en: 'Post', zh: '文章' }, plural: { en: 'Posts', zh: '博客文章' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'updatedAt'],
    group: { en: 'Content', zh: '内容管理' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', zh: '标题' },
      type: 'text',
      required: true,
      localized: true,
    },
    slugField('title'),
    {
      name: 'excerpt',
      label: { en: 'Excerpt', zh: '摘要' },
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'coverImage',
      label: { en: 'Cover Image', zh: '封面图' },
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'publishedAt',
      label: { en: 'Published', zh: '发布时间' },
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      label: { en: 'Author', zh: '作者' },
      type: 'text',
      admin: { position: 'sidebar' },
      defaultValue: 'Donglin Engineering Team',
    },
    {
      name: 'body',
      label: { en: 'Body', zh: '正文' },
      type: 'richText',
      required: true,
      localized: true,
    },
    seoField,
  ],
}
