import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCaseStudy, revalidateCaseStudyDelete } from '@/hooks/revalidate'

/**
 * 客户案例（二期）—— B2B 信任背书核心内容：
 * 行业 + 地点 + 成果指标 + 正文，关联产品形成内链。
 * 前端路由：/[locale]/cases 与 /[locale]/cases/[slug]。
 */
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: {
    singular: { en: 'Case Study', zh: '客户案例' },
    plural: { en: 'Case Studies', zh: '客户案例' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'industry', 'completedAt', 'updatedAt'],
    group: { en: 'Content', zh: '内容管理' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateCaseStudy],
    afterDelete: [revalidateCaseStudyDelete],
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', zh: '案例标题' },
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
      admin: {
        description: { en: 'Shown on the case list card.', zh: '案例列表卡片上的简介。' },
      },
    },
    {
      name: 'coverImage',
      label: { en: 'Cover Image', zh: '封面图' },
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'industry',
      label: { en: 'Industry', zh: '所属行业' },
      type: 'relationship',
      relationTo: 'application-scenarios',
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedProducts',
      label: { en: 'Related Products', zh: '涉及产品' },
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'location',
      label: { en: 'Project Location', zh: '项目地点' },
      type: 'text',
      localized: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'completedAt',
      label: { en: 'Completed', zh: '交付时间' },
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'monthOnly' } },
    },
    {
      // 项目成果指标（如 40% / Energy saved），详情页顶部数据条展示
      name: 'metrics',
      label: { en: 'Result Metrics', zh: '成果指标' },
      type: 'array',
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              label: { en: 'Value', zh: '数值' },
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'label',
              label: { en: 'Label', zh: '说明' },
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'body',
      label: { en: 'Body', zh: '案例正文' },
      type: 'richText',
      localized: true,
    },
    seoField,
  ],
}
