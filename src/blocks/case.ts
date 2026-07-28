import type { Block, Field } from 'payload'

/**
 * 客户案例详情页的排版积木块 —— 与 Pages 的 5 种块分开定义：
 * 案例是「编号章节」式的长图文叙事，块的粒度和固定页不同。
 *
 * 每块共用 kicker + heading 的章节头；章节序号（01 · / 02 ·）由渲染器
 * 按块的顺序自动生成，运营不用手填。底色也由渲染器按序号交替（白 / 浅灰），
 * 因此后台没有"底色"选项 —— 少一个能选错的地方。
 */

/** 章节头：所有案例块共用的前两个字段 */
const sectionHead: Field[] = [
  {
    name: 'kicker',
    label: { en: 'Section Label', zh: '章节小标' },
    type: 'text',
    required: true,
    localized: true,
    admin: {
      description: {
        en: 'Short label above the heading, e.g. "Client challenge". The number (01 ·) is added automatically.',
        zh: '标题上方的小标，如「客户的要求」。前面的编号（01 ·）由前台自动加，不用写。',
      },
    },
  },
  {
    name: 'heading',
    label: { en: 'Heading', zh: '章节标题' },
    type: 'text',
    required: true,
    localized: true,
    admin: {
      description: {
        en: 'One full sentence reads better than a two-word title at this size.',
        zh: '这个字号下，一句完整的话比两个词的标题更好看。',
      },
    },
  },
]

/** 01 · 问题陈述：左侧大标题，右侧引语 + 问题清单 */
export const CaseSplitBlock: Block = {
  slug: 'caseSplit',
  labels: {
    singular: { en: 'Challenge (two columns)', zh: '问题陈述（两栏）' },
    plural: { en: 'Challenges', zh: '问题陈述' },
  },
  fields: [
    ...sectionHead,
    {
      name: 'quote',
      label: { en: 'Pull Quote', zh: '引语' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'Client requirement in their own words. Optional; quotation marks are added by the page.',
          zh: '客户的原话要求；可留空。引号由前台自动加，不用写。',
        },
      },
    },
    {
      name: 'points',
      label: { en: 'Problem Points', zh: '问题清单' },
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'label',
          label: { en: 'Label', zh: '小标题' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '说明' },
          type: 'textarea',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}

/** 02 / 03 · 整幅图版：架构图、对比图 */
export const CaseFigureBlock: Block = {
  slug: 'caseFigure',
  labels: {
    singular: { en: 'Full-width Figure', zh: '整幅图版' },
    plural: { en: 'Full-width Figures', zh: '整幅图版' },
  },
  fields: [
    ...sectionHead,
    {
      name: 'intro',
      label: { en: 'Intro', zh: '引言' },
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      label: { en: 'Image', zh: '图片' },
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: {
          en: 'Diagrams read best at 1600px wide. Export vector diagrams to PNG first.',
          zh: '示意图建议 1600px 宽；矢量图先导出成 PNG 再传。',
        },
      },
    },
    {
      name: 'banner',
      label: { en: 'Banner Line', zh: '深色标语条' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'One line on a dark bar under the image, e.g. a signal-flow summary. Optional.',
          zh: '图下方深色条里的一行字，如信号流程概括；可留空。',
        },
      },
    },
  ],
}

/** 04 / 07 · 卡片网格：带图的组件介绍，或不带图的价值点 */
export const CaseCardsBlock: Block = {
  slug: 'caseCards',
  labels: {
    singular: { en: 'Card Grid', zh: '卡片网格' },
    plural: { en: 'Card Grids', zh: '卡片网格' },
  },
  fields: [
    ...sectionHead,
    {
      name: 'cards',
      label: { en: 'Cards', zh: '卡片' },
      type: 'array',
      minRows: 1,
      admin: {
        description: {
          en: 'With images: two per row, image on the left. Without images: three per row.',
          zh: '带图片时每行两张、图在左；不带图片时每行三张。',
        },
      },
      fields: [
        {
          name: 'image',
          label: { en: 'Image', zh: '图片' },
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'tag',
          label: { en: 'Tag', zh: '分类标签' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'Small uppercase label, e.g. "SENSING". Optional.',
              zh: '卡片上方的大写小标，如「SENSING」；可留空。',
            },
          },
        },
        {
          name: 'title',
          label: { en: 'Title', zh: '标题' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '说明' },
          type: 'textarea',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}

/** 05 · 实施步骤条 */
export const CaseStepsBlock: Block = {
  slug: 'caseSteps',
  labels: {
    singular: { en: 'Step Strip', zh: '步骤条' },
    plural: { en: 'Step Strips', zh: '步骤条' },
  },
  fields: [
    ...sectionHead,
    {
      name: 'steps',
      label: { en: 'Steps', zh: '步骤' },
      type: 'array',
      minRows: 2,
      maxRows: 6,
      admin: {
        description: {
          en: 'Numbered automatically in order. Six fit one row on desktop.',
          zh: '按顺序自动编号；桌面端一行最多放 6 步。',
        },
      },
      fields: [
        {
          name: 'title',
          label: { en: 'Title', zh: '步骤名' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '说明' },
          type: 'textarea',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}

/** 06 · 改造前后对比表 */
export const CaseCompareBlock: Block = {
  slug: 'caseCompare',
  labels: {
    singular: { en: 'Before / After Table', zh: '前后对比表' },
    plural: { en: 'Before / After Tables', zh: '前后对比表' },
  },
  fields: [
    ...sectionHead,
    {
      type: 'row',
      fields: [
        {
          name: 'labelArea',
          label: { en: 'Column 1 Header', zh: '第一列表头' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'labelBefore',
          label: { en: 'Column 2 Header', zh: '第二列表头' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'labelAfter',
          label: { en: 'Column 3 Header', zh: '第三列表头' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'rows',
      label: { en: 'Rows', zh: '对比行' },
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'area',
          label: { en: 'Area', zh: '对比项' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'before',
          label: { en: 'Before', zh: '改造前' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'after',
          label: { en: 'After', zh: '改造后' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}

/** 收尾 · 深蓝底的项目总结 */
export const CaseStatementBlock: Block = {
  slug: 'caseStatement',
  labels: {
    singular: { en: 'Closing Statement', zh: '收尾总结' },
    plural: { en: 'Closing Statements', zh: '收尾总结' },
  },
  fields: [
    ...sectionHead,
    {
      name: 'body',
      label: { en: 'Body', zh: '正文' },
      type: 'textarea',
      localized: true,
    },
    {
      name: 'statement',
      label: { en: 'Statement', zh: '大字标语' },
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The one sentence the reader should remember. Rendered large, centred, on navy.',
          zh: '希望读者记住的那一句；深蓝底居中大字展示。',
        },
      },
    },
  ],
}

/** 案例正文可用的全部块 —— 顺序即后台「添加区块」菜单里的顺序 */
export const caseBlocks: Block[] = [
  CaseSplitBlock,
  CaseFigureBlock,
  CaseCardsBlock,
  CaseStepsBlock,
  CaseCompareBlock,
  CaseStatementBlock,
]
