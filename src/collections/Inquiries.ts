import type { CollectionConfig } from 'payload'

import { authenticated, noOne } from '@/access'

/**
 * 询盘 —— 潜在客户线索，全站的核心产出。
 *
 * 访问控制（重要）：
 * - 公开 REST/GraphQL 完全关死（create/read 都是 noOne / authenticated）
 * - 写入只发生在服务端：/api/inquiries Route Handler 校验后走 Local API
 *   （Local API 默认 overrideAccess，绕过这里的 create: noOne）
 * - 后台运营：可读、可改 status，其余业务字段只读（admin.readOnly）
 */
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: { en: 'Inquiry', zh: '询盘' }, plural: { en: 'Inquiries', zh: '询盘管理' } },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'company', 'country', 'status', 'createdAt'],
    group: { en: 'Leads', zh: '线索' },
    description: {
      en: 'Submitted via the website inquiry form. Only the status can be edited.',
      zh: '由官网询盘表单写入；后台仅可修改跟进状态，其余字段只读。',
    },
  },
  access: {
    create: noOne, // 仅服务端 Local API 写入
    read: authenticated,
    update: authenticated, // 字段级 readOnly 限制实际只能改 status
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', zh: '姓名' },
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'email',
      label: { en: 'Email', zh: '邮箱' },
      type: 'email',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'company',
      label: { en: 'Company', zh: '公司' },
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'country',
      label: { en: 'Country', zh: '国家' },
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'phone',
      label: { en: 'Phone', zh: '电话' },
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'message',
      label: { en: 'Message', zh: '询盘内容' },
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
    },
    {
      // 从哪个产品页发起的询盘（可为空：来自首页/联系页的通用询盘）
      name: 'sourceProduct',
      label: { en: 'Source Product', zh: '来源产品' },
      type: 'relationship',
      relationTo: 'products',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'source',
      label: { en: 'Source Channel', zh: '来源渠道' },
      type: 'select',
      required: true,
      defaultValue: 'form',
      options: [
        { label: { en: 'Website Form', zh: '网站表单' }, value: 'form' },
        { label: { en: 'WhatsApp', zh: 'WhatsApp' }, value: 'whatsapp' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      // 唯一允许运营修改的字段：跟进状态
      name: 'status',
      label: { en: 'Status', zh: '跟进状态' },
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: [
        { label: { en: 'New', zh: '新询盘' }, value: 'new' },
        { label: { en: 'Contacted', zh: '已联系' }, value: 'contacted' },
        { label: { en: 'Closed', zh: '已关闭' }, value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
