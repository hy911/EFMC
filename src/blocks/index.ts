import type { Block } from 'payload'

/**
 * Pages（固定页）可用的 5 种布局 block —— 一期最小集，
 * 覆盖 About / 工厂实力 / Contact 三个页面的排版需求。
 * 每种 block 在前端有对应的渲染组件（src/blocks/renderers）。
 */

/** 富文本段落块 */
export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: { en: 'Rich Text', zh: '富文本' }, plural: { en: 'Rich Text', zh: '富文本' } },
  fields: [
    {
      name: 'content',
      label: { en: 'Content', zh: '内容' },
      type: 'richText',
      required: true,
      localized: true,
    },
  ],
}

/** 图片画廊块（也用于证书墙：勾选 fromCertificates 后自动拉取证书） */
export const ImageGalleryBlock: Block = {
  slug: 'imageGallery',
  labels: { singular: { en: 'Image Gallery', zh: '图片画廊' }, plural: { en: 'Image Galleries', zh: '图片画廊' } },
  fields: [
    {
      name: 'heading',
      label: { en: 'Heading', zh: '标题' },
      type: 'text',
      localized: true,
    },
    {
      name: 'fromCertificates',
      label: { en: 'Show certificates instead of manual images', zh: '自动展示资质证书（忽略下方手选图片）' },
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'images',
      label: { en: 'Images', zh: '图片' },
      type: 'array',
      admin: { condition: (_, siblingData) => !siblingData?.fromCertificates },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', label: { en: 'Caption', zh: '图注' }, type: 'text', localized: true },
      ],
    },
  ],
}

/** 数据指标网格块（如：成立年份 / 工程师数量） */
export const StatsGridBlock: Block = {
  slug: 'statsGrid',
  labels: { singular: { en: 'Stats Grid', zh: '数据指标' }, plural: { en: 'Stats Grids', zh: '数据指标' } },
  fields: [
    {
      name: 'stats',
      label: { en: 'Stats', zh: '指标' },
      type: 'array',
      minRows: 2,
      maxRows: 8,
      required: true,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', label: { en: 'Value', zh: '数值' }, type: 'text', required: true, localized: true },
            { name: 'label', label: { en: 'Label', zh: '说明' }, type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
  ],
}

/** CTA 横幅块（深蓝底 + 按钮，引导去联系页） */
export const CtaBannerBlock: Block = {
  slug: 'ctaBanner',
  labels: { singular: { en: 'CTA Banner', zh: 'CTA 横幅' }, plural: { en: 'CTA Banners', zh: 'CTA 横幅' } },
  fields: [
    {
      name: 'heading',
      label: { en: 'Heading', zh: '标题' },
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'body',
      label: { en: 'Body', zh: '正文' },
      type: 'textarea',
      localized: true,
    },
    {
      name: 'buttonLabel',
      label: { en: 'Button Label', zh: '按钮文字' },
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}

/** 询盘表单块（内嵌与首页相同的询盘表单） */
export const ContactFormBlock: Block = {
  slug: 'contactForm',
  labels: { singular: { en: 'Contact Form', zh: '询盘表单' }, plural: { en: 'Contact Forms', zh: '询盘表单' } },
  fields: [
    {
      name: 'heading',
      label: { en: 'Heading', zh: '标题' },
      type: 'text',
      localized: true,
    },
  ],
}

/** Pages collection 引用的完整 block 列表 */
export const pageBlocks: Block[] = [
  RichTextBlock,
  ImageGalleryBlock,
  StatsGridBlock,
  CtaBannerBlock,
  ContactFormBlock,
]
