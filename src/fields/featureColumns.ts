import type { ArrayField } from 'payload'

/**
 * 可复用的「多栏要点」字段定义 —— 被 Pages 的 featureColumns block 和
 * SiteSettings 的首页优势区共用，保证两处结构一致、加字段只改一处。
 *
 * 注意：数组结构本身不是 localized，只有内部叶子字段是。
 * 用 Local API 写另一语种时必须带上原有行 id（见 seed/index.ts）。
 */
export const featureColumnsField: ArrayField = {
  name: 'columns',
  label: { en: 'Columns', zh: '栏目' },
  type: 'array',
  minRows: 2,
  maxRows: 4,
  required: true,
  admin: {
    description: {
      en: '2–4 columns. Rendered as a 1px-divided grid; stacks to one column on mobile.',
      zh: '2–4 栏；渲染为 1px 分隔线网格，手机上自动堆成单栏。',
    },
  },
  fields: [
    {
      name: 'kicker',
      label: { en: 'Kicker', zh: '栏目小标' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Small uppercase label above the title, e.g. "INTEGRATED SOLUTIONS". Optional.',
          zh: '标题上方的大写小标，如「INTEGRATED SOLUTIONS」；可留空。',
        },
      },
    },
    {
      name: 'title',
      label: { en: 'Title', zh: '栏目标题' },
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'items',
      label: { en: 'Items', zh: '要点' },
      type: 'array',
      fields: [
        {
          name: 'label',
          label: { en: 'Bold Prefix', zh: '加粗前缀' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'Optional bold prefix for two-level items, e.g. "HARDWARE".',
              zh: '二级要点的加粗前缀，如「HARDWARE」；平铺要点留空即可。',
            },
          },
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '正文' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'footnote',
      label: { en: 'Footnote', zh: '脚注' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Grey-background note at the bottom of the column. Optional.',
          zh: '栏目底部的灰底小字；可留空。',
        },
      },
    },
  ],
}
