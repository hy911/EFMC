import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateProduct, revalidateProductDelete } from '@/hooks/revalidate'

/**
 * 产品 —— 面向海外 B2B 展示，不含价格与 MOQ，CTA 统一为 "Request a Quote"。
 * featured: true 的产品出现在首页"精选产品"区（最多取 6 个）。
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: { en: 'Product', zh: '产品' }, plural: { en: 'Products', zh: '产品' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'featured', 'updatedAt'],
    group: { en: 'Catalog', zh: '产品目录' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // 发布即刷新：产品详情页 + 首页（ISR 按需 revalidate）
    afterChange: [revalidateProduct],
    afterDelete: [revalidateProductDelete],
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', zh: '产品名称' },
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
        description: {
          en: 'Short summary shown on cards (1–2 sentences).',
          zh: '卡片上展示的一两句话简介。',
        },
      },
    },
    {
      name: 'description',
      label: { en: 'Description', zh: '详细介绍' },
      type: 'richText',
      localized: true,
    },
    {
      name: 'images',
      label: { en: 'Images', zh: '产品图片' },
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: { en: 'Image', zh: '图片' }, plural: { en: 'Images', zh: '图片' } },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
      admin: {
        description: { en: 'First image is the cover.', zh: '第一张作为封面图。' },
      },
    },
    {
      // 规格参数：键值对列表（如 输入电压 / 380V AC）
      name: 'specs',
      label: { en: 'Specifications', zh: '规格参数' },
      type: 'array',
      labels: { singular: { en: 'Spec', zh: '参数' }, plural: { en: 'Specs', zh: '参数' } },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              label: { en: 'Label', zh: '参数名' },
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'value',
              label: { en: 'Value', zh: '参数值' },
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'category',
      label: { en: 'Category', zh: '所属分类' },
      type: 'relationship',
      relationTo: 'product-categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      label: { en: 'Featured on homepage', zh: '首页精选' },
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Show in the homepage "Featured products" grid.',
          zh: '勾选后出现在首页"精选产品"区（按更新时间取前 6 个）。',
        },
      },
    },
    seoField,
  ],
}
