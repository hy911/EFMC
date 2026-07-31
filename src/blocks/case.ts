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
  {
    // 章节引言：标题下方那段铺垫，各版式都有；可留空
    name: 'intro',
    label: { en: 'Intro', zh: '章节引言' },
    type: 'textarea',
    localized: true,
    admin: {
      description: {
        en: 'One or two sentences under the heading, before the content below. Optional.',
        zh: '标题与下方内容之间的一两句铺垫；可留空。',
      },
    },
  },
  {
    // 底色：默认按顺序白 / 浅灰交替；指定后由这一节自己说了算
    name: 'theme',
    label: { en: 'Background', zh: '底色' },
    type: 'select',
    defaultValue: 'auto',
    options: [
      { label: { en: 'Auto (alternating)', zh: '自动交替' }, value: 'auto' },
      { label: { en: 'White', zh: '白' }, value: 'white' },
      { label: { en: 'Pale blue', zh: '浅蓝' }, value: 'wash' },
      { label: { en: 'Blue tint', zh: '蓝调' }, value: 'washBlue' },
      { label: { en: 'Navy', zh: '深蓝' }, value: 'dark' },
    ],
    admin: {
      description: {
        en: 'Leave on Auto unless this section needs to stand out. Two navy sections in a row read as one block.',
        zh: '除非这一节要跳出来，否则保持自动。连着两节深蓝会糊成一片。',
      },
    },
  },
  {
    name: 'themeImage',
    label: { en: 'Background Photo', zh: '底纹照片' },
    type: 'upload',
    relationTo: 'media',
    admin: {
      condition: (_, siblingData) => siblingData?.theme === 'dark',
      description: {
        en: 'Optional photo behind the navy wash. Use a wide, low-detail shot — text sits on top of it.',
        zh: '深蓝底后面的照片，可留空。挑宽幅、细节少的：文字要压在上面。',
      },
    },
  },
  {
    name: 'accentEdge',
    label: { en: 'Accent edge', zh: '左缘强调条' },
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: {
        en: 'A 9px gradient bar down the left edge of the section. Use once per page at most.',
        zh: '章节左缘一条 9px 渐变竖条；整页最多用一次，用多了就不叫强调了。',
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
          en: 'Client requirement in their own words, shown on a navy card. Optional; quotation marks are added by the page.',
          zh: '客户的原话要求，展示在深蓝卡片里；可留空。引号由前台自动加，不用写。',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'quoteLabel',
          label: { en: 'Quote Card Label', zh: '引语卡小标' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'Bottom of the quote card, e.g. "The client’s core requirement".',
              zh: '引语卡底部的小字，如「客户的核心诉求」。',
            },
          },
        },
        {
          name: 'quoteFooter',
          label: { en: 'Quote Card Footer', zh: '引语卡落款' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'One line under the label, e.g. "01 / Classify before spraying".',
              zh: '小标下面那行，如「01 / 先分类，再喷淋」。',
            },
          },
        },
      ],
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
      name: 'variant',
      label: { en: 'Layout', zh: '版式' },
      type: 'select',
      defaultValue: 'full',
      options: [
        { label: { en: 'Standalone section', zh: '独立章节' }, value: 'full' },
        { label: { en: 'Evidence for the section above', zh: '上一节的佐证图' }, value: 'side' },
      ],
      admin: {
        description: {
          en: 'Evidence mode merges into the section above (no number of its own) and puts the text in a navy panel beside the image.',
          zh: '佐证图会并进上一节（自己不占编号），文字放在图片右侧的深蓝面板里。',
        },
      },
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
      name: 'layout',
      label: { en: 'Layout', zh: '排布方式' },
      type: 'select',
      defaultValue: 'uniform',
      options: [
        { label: { en: 'Uniform grid', zh: '等宽网格' }, value: 'uniform' },
        {
          label: { en: 'Bento (first & last span full width)', zh: '拼贴（首末两张通栏）' },
          value: 'bento',
        },
        {
          label: { en: 'Metrics (figures left, evidence right)', zh: '数据（左侧读数，右侧佐证）' },
          value: 'metrics',
        },
      ],
      admin: {
        description: {
          en: 'Bento needs 4+ cards with images to look deliberate; with fewer it just looks uneven. Metrics is for test results — fill in each card’s Figure.',
          zh: '拼贴要 4 张以上带图卡片才成立，少于这个数只会显得参差不齐。数据版式给测试结果用，每张卡要填「大号数值」。',
        },
      },
    },
    {
      name: 'sideImage',
      label: { en: 'Metrics: Evidence Image', zh: '数据版式：佐证图' },
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.layout === 'metrics',
        description: {
          en: 'Photo beside the figures — a screenshot from the test itself reads best.',
          zh: '读数旁边那张图，用测试当时的实拍或截图最有说服力。',
        },
      },
    },
    {
      type: 'row',
      admin: { condition: (_, siblingData) => siblingData?.layout === 'metrics' },
      fields: [
        {
          name: 'sideImageLabel',
          label: { en: 'Evidence Tag', zh: '佐证图角标小字' },
          type: 'text',
          localized: true,
          admin: { description: { en: 'e.g. "Low-light test".', zh: '如「低照度测试」。' } },
        },
        {
          name: 'sideImageValue',
          label: { en: 'Evidence Figure', zh: '佐证图角标数值' },
          type: 'text',
          localized: true,
          admin: { description: { en: 'e.g. "35–40 lux".', zh: '如「35–40 lux」。' } },
        },
      ],
    },
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
          name: 'value',
          label: { en: 'Figure', zh: '大号数值' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'Only used by the Metrics layout, e.g. "99.9%".',
              zh: '只有「数据」版式会用到，如「99.9%」。',
            },
          },
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
    {
      // 数据小格：卡片下方一排「数值 + 说明」，用来交代口径（测试窗口、采样间隔、仪器台数）
      name: 'facts',
      label: { en: 'Method Facts', zh: '口径小格' },
      type: 'array',
      maxRows: 4,
      admin: {
        description: {
          en: 'A row of value + caption under the cards, for how the numbers were obtained. Optional.',
          zh: '卡片下方一排「数值 + 说明」，交代数据是怎么来的；可留空。',
        },
      },
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
          label: { en: 'Caption', zh: '说明' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'note',
      label: { en: 'Fine Print', zh: '小字说明' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'Small print under the block, e.g. "results are project-specific". Optional.',
          zh: '区块最下方的小字，如「结果因项目而异」；可留空。',
        },
      },
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
      name: 'style',
      label: { en: 'Layout', zh: '排布方式' },
      type: 'select',
      defaultValue: 'strip',
      options: [
        { label: { en: 'Signal strip (one row)', zh: '流程带（一排）' }, value: 'strip' },
        { label: { en: 'State flow (colour-coded)', zh: '状态流（彩色徽章）' }, value: 'flow' },
        { label: { en: 'Grid (three per row)', zh: '网格（每行三个）' }, value: 'grid' },
      ],
      admin: {
        description: {
          en: 'Strip suits a data path. Flow suits a fault sequence — set each step’s Tone. Grid suits a delivery checklist.',
          zh: '流程带适合数据流转；状态流适合故障处理链路，要给每步选「徽章色」；网格适合实施清单。',
        },
      },
    },
    {
      // 每格右上角那行极小的说明字，如「SYSTEM SIGNAL」；纯版式装饰，可留空
      name: 'cellLabel',
      label: { en: 'Cell Label', zh: '格内小标' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Tiny label in the top-right of every step, e.g. "SYSTEM SIGNAL". Optional.',
          zh: '每一格右上角的极小字，如「SYSTEM SIGNAL」；可留空。',
        },
      },
    },
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
          // 配图可选：全部步骤都配图才好看，只配一半会参差不齐
          name: 'image',
          label: { en: 'Image', zh: '配图' },
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: {
              en: 'Optional. Give every step a visual or none — a half-filled row looks broken.',
              zh: '可留空。要配就每步都配（示意图也算），只配一半会参差不齐。',
            },
          },
        },
        {
          // 有些环节没有可拍的实物（推理、传输），放张凑数的照片不如画个示意图
          name: 'pictogram',
          label: { en: 'Diagram instead of photo', zh: '用示意图代替照片' },
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: { en: 'None — use the photo', zh: '不用，走上面的配图' }, value: 'none' },
            { label: { en: 'AI inference', zh: 'AI 推理' }, value: 'ai' },
            { label: { en: 'Network transfer', zh: '网络传输' }, value: 'network' },
          ],
          admin: {
            description: {
              en: 'For steps with nothing physical to photograph. Overrides the image.',
              zh: '给「没有实物可拍」的环节用，如推理、传输。选了就不看配图。',
            },
          },
        },
        {
          name: 'title',
          label: { en: 'Title', zh: '步骤名' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'tone',
          label: { en: 'Tone', zh: '徽章色' },
          type: 'select',
          defaultValue: 'accent',
          options: [
            { label: { en: 'Blue — normal operation', zh: '蓝 · 正常运行' }, value: 'accent' },
            { label: { en: 'Red — fault detected', zh: '红 · 发现故障' }, value: 'flag' },
            { label: { en: 'Green — safe state', zh: '绿 · 已进入安全态' }, value: 'go' },
            { label: { en: 'Navy — logged', zh: '深蓝 · 记录留痕' }, value: 'navy' },
          ],
          admin: {
            description: {
              en: 'Only used by the State flow layout.',
              zh: '只有「状态流」版式会用到。',
            },
          },
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
    {
      // 佐证条：步骤条下方的深色数据块，如「5 秒响应（上一版为 5 分钟）」
      name: 'proofValue',
      label: { en: 'Proof Value', zh: '佐证数值' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Large figure under the strip, e.g. "5 sec". Optional; needs Proof Note too.',
          zh: '步骤条下方的大字数值，如「5 秒」；可留空，填了就要一并填佐证说明。',
        },
      },
    },
    {
      name: 'proofNote',
      label: { en: 'Proof Note', zh: '佐证说明' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'What the figure means and where it comes from.',
          zh: '这个数值是什么、出处在哪。',
        },
      },
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
    /* ---------- 图示面板（可选）：表格之上的「改造前 / 改造后」两块卡 ---------- */
    /* 整块以 panelImage 为开关：不传图就只出表格，老案例不受影响。 */
    {
      name: 'panelImage',
      label: { en: 'Panel: After Image', zh: '图示：改造后画面' },
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: {
          en: 'Turns on the illustrated before/after panel above the table. Leave empty for table only.',
          zh: '传了图才会在表格上方出现「改造前 / 改造后」图示面板；留空则只有表格。',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'panelBeforeLabel',
          label: { en: 'Panel: Before Label', zh: '图示：左卡角标' },
          type: 'text',
          localized: true,
          admin: { description: { en: 'e.g. "BEFORE".', zh: '如「改造前」。' } },
        },
        {
          name: 'panelBeforeTitle',
          label: { en: 'Panel: Before Title', zh: '图示：左卡标题' },
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'panelBeforeRows',
      label: { en: 'Panel: Before Cases', zh: '图示：左卡情形' },
      type: 'array',
      maxRows: 3,
      admin: {
        description: {
          en: 'Two situations that used to look identical to the controller.',
          zh: '在旧逻辑下看起来完全一样的两种情形。',
        },
      },
      fields: [
        {
          name: 'image',
          label: { en: 'Thumbnail', zh: '缩略图' },
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: {
              en: 'Optional. Without one, the symbol text is shown in a bordered square instead.',
              zh: '可留空；不传就在方框里显示下面的符号文字。',
            },
          },
        },
        {
          name: 'symbol',
          label: { en: 'Symbol', zh: '符号文字' },
          type: 'text',
          required: true,
          localized: true,
          admin: { description: { en: 'e.g. "COW" / "PERSON".', zh: '如「牛」「人」。' } },
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '情形' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'note',
          label: { en: 'Note', zh: '副说明' },
          type: 'text',
          localized: true,
        },
        {
          name: 'tag',
          label: { en: 'Outcome Tag', zh: '结果角标' },
          type: 'text',
          localized: true,
          admin: { description: { en: 'e.g. "TRIGGER".', zh: '如「触发」。' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'panelBeforeResultLabel',
          label: { en: 'Panel: Before Result Label', zh: '图示：左卡结论小标' },
          type: 'text',
          localized: true,
        },
        {
          name: 'panelBeforeResultValue',
          label: { en: 'Panel: Before Result', zh: '图示：左卡结论' },
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'panelAfterLabel',
          label: { en: 'Panel: After Label', zh: '图示：右卡角标' },
          type: 'text',
          localized: true,
        },
        {
          name: 'panelAfterTitle',
          label: { en: 'Panel: After Title', zh: '图示：右卡标题' },
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'panelImageTags',
      label: { en: 'Panel: Image Overlays', zh: '图示：画面浮标' },
      type: 'array',
      maxRows: 3,
      admin: {
        description: {
          en: 'Small tags laid over the image, e.g. "COW · 0.99".',
          zh: '浮在画面上的小标签，如「COW · 0.99」。',
        },
      },
      fields: [
        {
          name: 'text',
          label: { en: 'Text', zh: '文字' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'corner',
          label: { en: 'Corner', zh: '位置' },
          type: 'select',
          defaultValue: 'bottomLeft',
          options: [
            { label: { en: 'Bottom left', zh: '左下' }, value: 'bottomLeft' },
            { label: { en: 'Top right', zh: '右上' }, value: 'topRight' },
            { label: { en: 'Top left', zh: '左上' }, value: 'topLeft' },
          ],
        },
      ],
    },
    {
      name: 'panelAfterFacts',
      label: { en: 'Panel: After Readout', zh: '图示：右卡读数' },
      type: 'array',
      maxRows: 3,
      admin: {
        description: {
          en: 'The decision the control layer reaches. Mark the last one as the outcome.',
          zh: '控制层得出的判断；把最终结论那一格勾上「结论格」。',
        },
      },
      fields: [
        {
          name: 'label',
          label: { en: 'Label', zh: '小标' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'value',
          label: { en: 'Value', zh: '读数' },
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'highlight',
          label: { en: 'Outcome cell', zh: '结论格' },
          type: 'checkbox',
          defaultValue: false,
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
