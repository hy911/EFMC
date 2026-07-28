#!/usr/bin/env node
/**
 * 导入客户案例：精准喷淋降温改造（Precision Spray-Cooling），中英双语。
 *
 * 排版按客户认可的设计稿（index.html）拆成 8 个案例章节块，
 * 章节编号与底色交替由前台按顺序自动生成，这里只给内容。
 *
 * 素材来自 D:/precision-spray-cooling-case-study-final（可用 --assets 覆盖）：
 *   hero-dairy-barn.jpg        封面（页头满幅背景）
 *   control-transformation.svg 改造前后对比图（脚本自动转 PNG）
 *   system-architecture.svg    系统架构图（同上）
 *   sensing-enclosure.jpg / t-cable-harness.jpg / plc-control-panel.jpg / mobile-operations-app.png
 *
 * 用法：
 *   node scripts/import-case-study-spray-cooling.mjs --dry-run
 *   node scripts/import-case-study-spray-cooling.mjs
 *   node scripts/import-case-study-spray-cooling.mjs --replace   已存在时覆盖章节
 *   node scripts/import-case-study-spray-cooling.mjs --replace --prune  同时删掉被换下的旧图
 *
 * sections 是 localized blocks —— 写 zh 必须带上 en 回读到的 block id 和
 * 内层数组行 id，否则整个数组被重建、en 内容全丢（见 CLAUDE.md）。
 * 下面的 mergeLocale() 就是干这个的。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { api, login, requireEnv, uploadMedia } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const REPLACE = args.includes('--replace')
const PRUNE = args.includes('--prune')
const ASSETS = args.includes('--assets')
  ? args[args.indexOf('--assets') + 1]
  : 'D:/precision-spray-cooling-case-study-final/assets'

const SLUG = 'precision-spray-cooling-dairy-retrofit'
/** SVG 转出的 PNG 放这里，不动素材目录 */
const OUT_DIR = path.resolve(process.cwd(), 'photos-out', 'cases', SLUG)

/** 图片：key → 文件名 + 中英 alt */
const IMAGES = {
  hero: {
    file: 'hero-dairy-barn.jpg',
    en: 'Sensor-activated spray-cooling retrofit in a commercial dairy barn',
    zh: '商业牧场牛舍内的传感器触发式喷淋降温改造',
  },
  transformation: {
    file: 'control-transformation.svg',
    en: 'Engineering comparison of row-level spraying and position-level precision control',
    zh: '整排喷淋与单位置精准控制的工程对比',
  },
  architecture: {
    file: 'system-architecture.svg',
    en: 'Layered architecture of the sensor-activated precision spray-cooling system',
    zh: '传感器触发式精准喷淋降温系统的分层架构',
  },
  enclosure: {
    file: 'sensing-enclosure.jpg',
    en: 'Purpose-built sensing enclosure',
    zh: '专门设计的感应盒',
  },
  harness: {
    file: 't-cable-harness.jpg',
    en: 'Plug-and-play T-cable harness',
    zh: '即插即用 T 型线束',
  },
  plc: {
    file: 'plc-control-panel.jpg',
    en: 'Dedicated PLC control panel',
    zh: '专用 PLC 控制柜',
  },
  app: {
    file: 'mobile-operations-app.png',
    en: 'Mobile equipment status screen',
    zh: '移动端设备状态界面',
  },
}

const EN = {
  title: 'Cooling Only Where It Matters',
  excerpt:
    'A commercial dairy needed to move beyond row-level spraying. We engineered a stall-level control system that detects cow presence and activates only the corresponding spray position.',
  sections: (m) => [
    {
      blockType: 'caseSplit',
      kicker: 'Client challenge',
      heading: 'The system could deliver water—but not according to actual cow occupancy.',
      quote:
        'Detect whether a cow is present at each position, and activate only the nozzle serving that occupied position.',
      points: [
        {
          label: 'Empty-position spraying',
          text: 'Every nozzle on the line operated, even when positions were unoccupied.',
        },
        {
          label: 'Coarse control',
          text: 'A single valve controlled an entire row—or, in some areas, a complete barn line.',
        },
        {
          label: 'Installation and maintenance burden',
          text: 'Long cable runs and secondary field wiring slowed installation and troubleshooting.',
        },
      ],
    },
    {
      blockType: 'caseFigure',
      kicker: 'The control transformation',
      heading: 'From pipe-level operation to cow-position-level control.',
      image: m.transformation,
    },
    {
      blockType: 'caseFigure',
      kicker: 'Engineered system',
      heading: 'One coordinated architecture—from presence detection to remote operations.',
      intro:
        'The requirement could not be solved by adding a sensor alone. Sensing, field connectivity, PLC decision logic, individual valve actuation and operator visibility had to operate as one control loop.',
      image: m.architecture,
      banner:
        'Presence Detection → Field Signal → PLC Decision → Individual Valve Actuation → Operational Feedback',
    },
    {
      blockType: 'caseCards',
      kicker: 'Purpose-built hardware and software',
      heading:
        'Four custom elements designed around the barn—not adapted from a generic control package.',
      cards: [
        {
          image: m.enclosure,
          tag: '01 / Sensing',
          title: 'Purpose-Built Sensing Enclosure',
          text: 'Evaluates cow presence at the corresponding spray position and sends the field signal to the control system.',
        },
        {
          image: m.harness,
          tag: '02 / Connectivity',
          title: 'Plug-and-Play T-Cable Harness',
          text: 'Standardized connections eliminate unnecessary secondary wiring and simplify installation, replacement and expansion.',
        },
        {
          image: m.plc,
          tag: '03 / Control',
          title: 'Dedicated PLC Control',
          text: 'Applies presence, temperature, timing and zoning logic before commanding the corresponding solenoid valve.',
        },
        {
          image: m.app,
          tag: '04 / Operations',
          title: 'Mobile Operations App',
          text: 'Provides equipment status, operating visibility, parameter review and faster localization of abnormal device states.',
        },
      ],
    },
    {
      blockType: 'caseSteps',
      kicker: 'Delivery approach',
      heading: 'Survey first. Configure for the actual barn. Retrofit by zone.',
      steps: [
        { title: 'Site Survey', text: 'Map water, power, cable routes and existing controls.' },
        {
          title: 'Control Zoning',
          text: 'Define positions, sensors, valves and spray points.',
        },
        {
          title: 'Configuration',
          text: 'Prepare enclosures, harnesses and panels for the barn.',
        },
        {
          title: 'Installation',
          text: 'Retrofit by zone to reduce operational disruption.',
        },
        {
          title: 'Commissioning',
          text: 'Verify detection, control logic, valve response and timing.',
        },
        { title: 'Handover', text: 'Configure mobile operations and train the dairy team.' },
      ],
    },
    {
      blockType: 'caseCompare',
      kicker: 'Before and after',
      heading: 'A measurable change in how the system is controlled and maintained.',
      labelArea: 'Control area',
      labelBefore: 'Before retrofit',
      labelAfter: 'After retrofit',
      rows: [
        {
          area: 'Presence detection',
          before: 'No position-level detection',
          after: 'Presence evaluated at each spray position',
        },
        {
          area: 'Spray control',
          before: 'Entire row or barn line',
          after: 'Individual occupied positions',
        },
        {
          area: 'Field connection',
          before: 'Secondary wiring required',
          after: 'Plug-and-play T-cable harness',
        },
        {
          area: 'Control logic',
          before: 'Coarse line-level operation',
          after: 'PLC-based temperature, timing and zoning logic',
        },
        {
          area: 'System visibility',
          before: 'On-site inspection',
          after: 'Mobile equipment-status visibility',
        },
        {
          area: 'Troubleshooting',
          before: 'Broad manual search',
          after: 'Faster localization by zone and device',
        },
      ],
    },
    {
      blockType: 'caseCards',
      kicker: 'Value delivered',
      heading:
        'Precision at the spray position. Simplicity in the field. Visibility for operations.',
      cards: [
        {
          title: 'More Targeted Cooling',
          text: 'Spray activation follows actual occupancy instead of opening every nozzle on the line.',
        },
        {
          title: 'Cleaner Installation',
          text: 'Purpose-built, plug-and-play connections reduce field wiring and make replacement easier.',
        },
        {
          title: 'More Visible Operations',
          text: 'PLC control and the mobile interface make status, parameters and abnormal conditions easier to manage.',
        },
      ],
    },
    {
      blockType: 'caseStatement',
      kicker: 'Project perspective',
      heading: 'The retrofit redefined the smallest controllable unit of the cooling system.',
      body: 'Control moved from the pipe level to the cow-position level—supported by purpose-built sensing, connectivity, automation and mobile operations.',
      statement:
        'The goal is not to make every nozzle operate. It is to make the right nozzle operate at the right position.',
    },
  ],
}

/** zh 只给需要翻译的叶子字段；结构、图片、行 id 从 en 继承 */
const ZH = {
  title: '只在需要的位置降温',
  excerpt:
    '牧场需要摆脱整排喷淋的粗放方式。我们设计了牛位级控制系统：检测牛只是否在位，只启动对应位置的喷头。',
  sections: [
    {
      kicker: '客户的难题',
      heading: '原系统能把水送出去，却送不到真正需要的位置。',
      quote: '检测每个位置上是否有牛，只启动该位置对应的喷头。',
      points: [
        { label: '空位置照喷', text: '管线上的所有喷头一起动作，位置上没有牛也照喷。' },
        { label: '控制颗粒度粗', text: '一个阀控制一整排——部分区域甚至是一整条牛舍管线。' },
        { label: '安装与维护负担重', text: '线路长、现场二次接线多，安装和排查都被拖慢。' },
      ],
    },
    {
      kicker: '控制方式的转变',
      heading: '从管路级运行，下沉到牛位级控制。',
    },
    {
      kicker: '系统工程',
      heading: '一套协同的架构——从在位检测一直到远程运维。',
      intro:
        '这个需求不是加个传感器就能解决的。感应、现场连接、PLC 判断逻辑、单阀执行与运行可见性，必须作为一个控制闭环协同工作。',
      banner: '在位检测 → 现场信号 → PLC 判断 → 单阀执行 → 运行反馈',
    },
    {
      kicker: '专门设计的软硬件',
      heading: '四个围绕牛舍现场定制的部件——不是通用控制方案改一改。',
      cards: [
        {
          tag: '01 / 感应',
          title: '专用感应盒',
          text: '判断对应喷淋位置上是否有牛，并把现场信号送给控制系统。',
        },
        {
          tag: '02 / 连接',
          title: '即插即用 T 型线束',
          text: '标准化连接取消了不必要的二次接线，安装、更换与扩展都更简单。',
        },
        {
          tag: '03 / 控制',
          title: '专用 PLC 控制',
          text: '综合在位、温度、时序与分区逻辑判断后，再驱动对应的电磁阀。',
        },
        {
          tag: '04 / 运维',
          title: '移动端运维 App',
          text: '提供设备状态、运行可见性与参数查看，设备异常也能更快定位。',
        },
      ],
    },
    {
      kicker: '实施方式',
      heading: '先勘查，按实际牛舍配置，分区改造。',
      steps: [
        { title: '现场勘查', text: '梳理水路、电源、线缆走向与现有控制。' },
        { title: '控制分区', text: '确定牛位、传感器、阀门与喷淋点的对应关系。' },
        { title: '按需配置', text: '按牛舍实际情况准备感应盒、线束与控制柜。' },
        { title: '分区安装', text: '按区改造，尽量不影响日常生产。' },
        { title: '系统调试', text: '验证检测、控制逻辑、阀门响应与时序。' },
        { title: '交付培训', text: '配置移动端运维并培训牧场团队。' },
      ],
    },
    {
      kicker: '改造前后',
      heading: '控制方式与维护方式都发生了实实在在的变化。',
      labelArea: '对比项',
      labelBefore: '改造前',
      labelAfter: '改造后',
      rows: [
        { area: '在位检测', before: '没有位置级检测', after: '逐个喷淋位置判断在位' },
        { area: '喷淋控制', before: '整排或整条牛舍管线', after: '只喷有牛的位置' },
        { area: '现场连接', before: '需要二次接线', after: '即插即用 T 型线束' },
        { area: '控制逻辑', before: '管线级粗控', after: 'PLC 的温度、时序与分区逻辑' },
        { area: '状态可见性', before: '到现场逐个看', after: '移动端查看设备状态' },
        { area: '故障排查', before: '大范围人工查找', after: '按分区与设备快速定位' },
      ],
    },
    {
      kicker: '交付价值',
      heading: '喷淋位置更精准，现场更简洁，运行更透明。',
      cards: [
        {
          title: '降温更有的放矢',
          text: '按牛只实际在位启动喷淋，不再一开就是整条管线的喷头。',
        },
        {
          title: '现场更干净',
          text: '专门设计的即插即用连接减少了现场接线，更换也更方便。',
        },
        {
          title: '运行更透明',
          text: 'PLC 控制与移动端界面让状态、参数与异常都更容易管理。',
        },
      ],
    },
    {
      kicker: '项目回顾',
      heading: '这次改造重新定义了降温系统的最小可控单元。',
      body: '控制粒度从管路级下沉到牛位级——由专用感应、现场连接、自动化控制与移动运维共同支撑。',
      statement: '目标不是让每个喷头都动，而是让对的喷头在对的位置动。',
    },
  ],
}

/**
 * 把 zh 的叶子字段合并进 en 回读的节点，保留全部 id（block id / 数组行 id）。
 * 数组按下标一一对应；zh 里没写的字段沿用 en 的值。
 */
function mergeLocale(enNode, zhNode) {
  const out = { ...enNode }
  for (const [key, zhValue] of Object.entries(zhNode)) {
    if (Array.isArray(zhValue)) {
      const enRows = Array.isArray(enNode?.[key]) ? enNode[key] : []
      out[key] = zhValue.map((row, i) => mergeLocale(enRows[i] ?? {}, row))
    } else {
      out[key] = zhValue
    }
  }
  return out
}

/**
 * SVG 先转 PNG（Media 只做位图处理，直传 SVG 会按内在尺寸栅格化）。
 * 2400px 宽是给 2 倍屏留的余量：图版容器约 1180 CSS 像素，
 * 前台用原图渲染，源图不够宽的话细线和小字会糊。
 */
async function resolveAsset(file) {
  const src = path.join(ASSETS, file)
  if (!/\.svg$/i.test(file)) return src
  const out = path.join(OUT_DIR, file.replace(/\.svg$/i, '.png'))
  await fs.mkdir(OUT_DIR, { recursive: true })
  await sharp(src, { density: 300 }).resize({ width: 2400 }).png().toFile(out)
  return out
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}`)
  console.log(`素材目录：${ASSETS}\n`)

  // 素材齐不齐先查，别登录完了才发现少图
  for (const { file } of Object.values(IMAGES)) {
    await fs.access(path.join(ASSETS, file)).catch(() => {
      console.error(`✗ 找不到素材 ${file}（在 ${ASSETS}）`)
      process.exit(1)
    })
  }

  await login()

  const found = await api(`/api/case-studies?where[slug][equals]=${SLUG}&limit=1&locale=en&depth=0`)
  const existing = found.docs?.[0]
  if (existing && !REPLACE) {
    console.error(`\n✗ 案例已存在（id ${existing.id}），加 --replace 才会覆盖章节。`)
    if (!DRY) process.exit(1)
  }

  // 行业：牧场归到农业创新
  const inds = await api(
    '/api/application-scenarios?where[slug][equals]=agricultural-innovation&limit=1&locale=en&depth=0',
  )
  const industryId = inds.docs?.[0]?.id ?? null
  if (!industryId) console.warn('⚠️ 没找到 agricultural-innovation 行业，本次不设所属行业')

  // 关联产品：PLC 控制柜 + 现场仪表/操作箱
  const relatedSlugs = [
    'siemens-s7-1200-plc-control-cabinet',
    'instrument-enclosure-operator-valve-control-box',
  ]
  const prods = await api('/api/products?limit=100&locale=en&depth=0')
  const idBySlug = new Map((prods.docs ?? []).map((d) => [d.slug, d.id]))
  const relatedProducts = relatedSlugs.map((s) => idBySlug.get(s)).filter(Boolean)

  if (DRY) {
    const preview = EN.sections({})
    console.log(`将${existing ? '覆盖' : '创建'}案例：${SLUG}`)
    console.log(`  EN：${EN.title}　|　ZH：${ZH.title}`)
    console.log(`  图片：${Object.keys(IMAGES).length} 张（其中 2 张 SVG 会转 PNG）`)
    console.log(`  所属行业：${industryId ? 'agricultural-innovation' : '（无）'}`)
    console.log(`  关联产品：${relatedProducts.length} 个 —— ${relatedSlugs.join(', ')}`)
    console.log(`\n  ${preview.length} 个章节：`)
    preview.forEach((b, i) => {
      console.log(`    ${String(i + 1).padStart(2, '0')} · ${b.kicker}　[${b.blockType}]`)
    })
    if (preview.length !== ZH.sections.length) {
      console.error(`\n✗ 中英章节数不一致（en ${preview.length} / zh ${ZH.sections.length}）`)
      process.exit(1)
    }
    console.log('\n未填字段（后台补）：项目地点、交付时间、成果指标。')
    console.log('这是空跑，没有写入任何数据。')
    return
  }

  // 覆盖前先记下现有引用的图片，--prune 时在写入成功后删掉
  const oldMediaIds = existing
    ? [
        existing.coverImage,
        ...(existing.sections ?? []).flatMap((b) => [
          b.image,
          ...(b.cards ?? []).map((c) => c.image),
        ]),
      ].filter((v) => typeof v === 'number')
    : []

  // 上传全部图片，拿到 media id
  const media = {}
  for (const [key, info] of Object.entries(IMAGES)) {
    const file = await resolveAsset(info.file)
    media[key] = await uploadMedia(file, info.en, info.zh)
    console.log(`  ↑ ${info.file} → media ${media[key]}`)
  }

  const payloadEn = {
    title: EN.title,
    slug: SLUG,
    excerpt: EN.excerpt,
    coverImage: media.hero,
    industry: industryId,
    relatedProducts,
    sections: EN.sections(media),
    // 简版正文清空：本案例走章节排版，两者都有会重复渲染一遍。
    // body 是 localized 字段 —— 这里只清 en，zh 必须在下面的 zh PATCH 里再清一次
    body: null,
  }

  let id
  if (existing) {
    const r = await api(`/api/case-studies/${existing.id}?locale=en`, {
      method: 'PATCH',
      body: payloadEn,
    })
    id = r.doc.id
    console.log(`✓ 已更新 en 内容（id ${id}）`)
  } else {
    const r = await api('/api/case-studies?locale=en', { method: 'POST', body: payloadEn })
    id = r.doc.id
    console.log(`✓ 已创建案例（id ${id}）`)
  }

  // 回读 en 拿到 block id 与数组行 id，再写 zh
  const saved = await api(`/api/case-studies/${id}?locale=en&depth=0`)
  const zhSections = (saved.sections ?? []).map((block, i) => mergeLocale(block, ZH.sections[i] ?? {}))
  await api(`/api/case-studies/${id}?locale=zh`, {
    method: 'PATCH',
    body: { title: ZH.title, excerpt: ZH.excerpt, sections: zhSections, body: null },
  })
  console.log('✓ 已写入 zh 内容')

  // 自检：en 章节没被 zh 覆盖，图片还在，两个语种的旧正文都清干净了
  const checkEn = await api(`/api/case-studies/${id}?locale=en&depth=0`)
  const enFigure = (checkEn.sections ?? []).find((b) => b.blockType === 'caseFigure')
  if (checkEn.title !== EN.title || !enFigure?.image) {
    console.error('⚠️ en 内容被覆盖了，检查 mergeLocale 是否带上了行 id')
    process.exit(1)
  }
  // fallback: false 才能看到 zh 自己的值；否则 zh 为空时会回落成 en 的内容
  const checkZh = await api(`/api/case-studies/${id}?locale=zh&depth=0&fallback-locale=none`)
  const leftover = [
    checkEn.body && 'en',
    checkZh.body && 'zh',
  ].filter(Boolean)
  if (leftover.length) {
    console.error(`⚠️ ${leftover.join(' / ')} 的旧正文没清掉，前台会在章节下面重复渲染一遍`)
    process.exit(1)
  }
  console.log(
    `自检通过：en 仍是「${checkEn.title}」、zh 是「${checkZh.title}」，` +
      `各 ${checkEn.sections.length} 个章节，旧正文已清空`,
  )
  if (PRUNE && oldMediaIds.length) {
    for (const mediaId of oldMediaIds) {
      await api(`/api/media/${mediaId}`, { method: 'DELETE' }).catch((e) =>
        console.warn(`  旧图 ${mediaId} 删除失败（可能被别处引用）：${e.message}`),
      )
    }
    console.log(`✓ 已删除 ${oldMediaIds.length} 张被换下的旧图`)
  } else if (oldMediaIds.length) {
    console.log(
      `\n注意：${oldMediaIds.length} 张旧图仍留在媒体库（已无人引用）。` +
        `确认新图无误后加 --prune 重跑清理，或在后台手动删。`,
    )
  }

  console.log(`\n前台地址：${base}/en/cases/${SLUG}　|　${base}/zh/cases/${SLUG}`)
  console.log('后台待补：项目地点、交付时间（月）、成果指标（有实测数据再填）。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
