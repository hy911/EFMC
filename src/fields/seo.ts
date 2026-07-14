import type { GroupField } from 'payload'

/**
 * 可复用的 SEO 字段组 —— 嵌入每个内容型 collection（Products、Pages、
 * ApplicationScenarios 等）。全部关键字段开 localized，供 hreflang 分语种输出。
 *
 * 前端消费位置：各页面的 generateMetadata()。
 */
export const seoField: GroupField = {
  name: 'seo',
  label: { en: 'SEO', zh: 'SEO 设置' },
  type: 'group',
  admin: {
    description: {
      en: 'Overrides the auto-generated meta tags for this document.',
      zh: '覆盖本条内容自动生成的 meta 标签；留空则使用标题/摘要兜底。',
    },
  },
  fields: [
    {
      name: 'metaTitle',
      label: { en: 'Meta Title', zh: 'Meta 标题' },
      type: 'text',
      localized: true,
      maxLength: 70,
    },
    {
      name: 'metaDescription',
      label: { en: 'Meta Description', zh: 'Meta 描述' },
      type: 'textarea',
      localized: true,
      maxLength: 160,
    },
    {
      name: 'ogImage',
      label: { en: 'Open Graph Image', zh: '分享图（OG Image）' },
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
