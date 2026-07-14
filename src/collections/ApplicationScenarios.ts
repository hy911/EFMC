import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'

/**
 * 应用行业（智慧水务、先进制造、新能源、农业、传统工业……）。
 * 首页"Industries"区按 displayOrder 取前 5 个展示。
 */
export const ApplicationScenarios: CollectionConfig = {
  slug: 'application-scenarios',
  labels: {
    singular: { en: 'Application Scenario', zh: '应用行业' },
    plural: { en: 'Application Scenarios', zh: '应用行业' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'displayOrder', 'updatedAt'],
    group: { en: 'Catalog', zh: '产品目录' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', zh: '行业名称' },
      type: 'text',
      required: true,
      localized: true,
    },
    slugField('name'),
    {
      // 行业卡片上的短标签，如 "Treatment · Pumping · SCADA"
      name: 'tagline',
      label: { en: 'Tagline', zh: '短标签' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Short keywords shown under the name, e.g. "Treatment · Pumping · SCADA".',
          zh: '名称下方的关键词，如 "水处理 · 泵站 · SCADA"。',
        },
      },
    },
    {
      name: 'image',
      label: { en: 'Image', zh: '配图' },
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'description',
      label: { en: 'Description', zh: '行业描述' },
      type: 'richText',
      localized: true,
    },
    {
      name: 'relatedProducts',
      label: { en: 'Related Products', zh: '关联产品' },
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'displayOrder',
      label: { en: 'Display Order', zh: '展示顺序' },
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: { en: 'Lower numbers appear first.', zh: '数字越小越靠前。' },
      },
    },
    seoField,
  ],
}
