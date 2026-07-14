import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'

/** 资质与授权证书（ABB/施耐德授权书、ISO、专利等），用于"工厂实力"页与信任背书 */
export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: {
    singular: { en: 'Certificate', zh: '证书' },
    plural: { en: 'Certificates', zh: '资质证书' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'issuer', 'type', 'updatedAt'],
    group: { en: 'Company', zh: '公司信息' },
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
      label: { en: 'Certificate Name', zh: '证书名称' },
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'issuer',
      label: { en: 'Issuer', zh: '发证方' },
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'image',
      label: { en: 'Certificate Image', zh: '证书图片' },
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'type',
      label: { en: 'Type', zh: '证书类型' },
      type: 'select',
      required: true,
      defaultValue: 'authorization',
      options: [
        { label: { en: 'Brand Authorization', zh: '品牌授权' }, value: 'authorization' },
        { label: { en: 'Quality System', zh: '质量体系' }, value: 'quality' },
        { label: { en: 'Patent', zh: '专利' }, value: 'patent' },
        { label: { en: 'Other', zh: '其他' }, value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'issuedAt',
      label: { en: 'Issued Date', zh: '发证日期' },
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
