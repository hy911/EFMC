import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { caseBlocks } from '@/blocks/case'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCaseStudy, revalidateCaseStudyDelete } from '@/hooks/revalidate'
import { buildPreviewURL } from '@/lib/preview'

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
    // 后台「预览」按钮：草稿态也能看到真实渲染效果（走 /api/preview 开草稿模式）
    preview: (doc, { locale }) => buildPreviewURL('cases', doc?.slug as string, locale),
  },
  /**
   * 草稿：外部写手交来的内容先导成草稿，拿预览链接反复改，满意了再发布。
   * Payload 存草稿时不写主表（只写版本表），所以草稿不会顶掉线上已发布的内容。
   */
  versions: {
    drafts: true,
    maxPerDoc: 20,
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
    {
      // 页头大标题的第二行，用浅蓝显示。填了就把 title 当第一行，两行分色排版
      name: 'titleAccent',
      label: { en: 'Title, second line', zh: '标题第二行' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Optional. Shown under the title in pale blue — split the headline where it naturally breaks, e.g. "Recognition" / "before actuation."',
          zh: '可留空。填了就在标题下方用浅蓝显示，按标题本来的断句拆，如「先认出来」/「再动作」。',
        },
      },
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
      // 页头导语下方的能力标签，如「人牛分类 / 分区控制 / AI+PLC 闭环」
      name: 'highlights',
      label: { en: 'Capability Tags', zh: '能力标签' },
      type: 'array',
      maxRows: 4,
      admin: {
        description: {
          en: 'Short phrases shown under the lead paragraph in the page header. 2–4 works best.',
          zh: '页头导语下方的短语标签，2–4 个最合适。',
        },
      },
      fields: [
        {
          name: 'label',
          label: { en: 'Label', zh: '标签' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      // 排版化正文：编号章节，每块一种版式（见 src/blocks/case.ts）
      name: 'sections',
      label: { en: 'Sections', zh: '案例章节' },
      type: 'blocks',
      blocks: caseBlocks,
      admin: {
        description: {
          en: 'Numbering and alternating backgrounds follow block order automatically.',
          zh: '章节编号与底色交替按块的顺序自动生成，不用手填。',
        },
      },
    },
    {
      name: 'body',
      label: { en: 'Body (plain)', zh: '案例正文（纯文）' },
      type: 'richText',
      localized: true,
      admin: {
        description: {
          en: 'Fallback for cases without designed sections. Rendered after the sections above.',
          zh: '没有排版章节时的简版正文；有章节时会接在章节后面渲染。',
        },
      },
    },
    seoField,
  ],
}
