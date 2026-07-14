import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateProductsIndex } from '@/hooks/revalidate'

/** 产品分类（如：控制柜、HMI、变频与传动、水处理自动化） */
export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: { en: 'Product Category', zh: '产品分类' },
    plural: { en: 'Product Categories', zh: '产品分类' },
  },
  admin: {
    useAsTitle: 'name',
    group: { en: 'Catalog', zh: '产品目录' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // 分类变更刷新产品列表页分组
    afterChange: [revalidateProductsIndex],
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', zh: '分类名称' },
      type: 'text',
      required: true,
      localized: true,
    },
    slugField('name'),
    {
      name: 'description',
      label: { en: 'Description', zh: '分类描述' },
      type: 'textarea',
      localized: true,
    },
  ],
}
