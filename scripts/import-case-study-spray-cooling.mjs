#!/usr/bin/env node
/**
 * 导入客户案例：精准喷淋降温改造（Precision Spray-Cooling），中英双语。
 *
 * 素材来自 D:/precision-spray-cooling-case-study-final（可用 --assets 覆盖）：
 *   hero-dairy-barn.jpg        封面
 *   control-transformation.svg 改造前后对比图（脚本自动转 PNG，Media 不收 SVG 的矢量优势）
 *   system-architecture.svg    系统架构图（同上）
 *   sensing-enclosure.jpg / t-cable-harness.jpg / plc-control-panel.jpg / mobile-operations-app.png
 *
 * 用法：
 *   node scripts/import-case-study-spray-cooling.mjs --dry-run
 *   node scripts/import-case-study-spray-cooling.mjs
 *   node scripts/import-case-study-spray-cooling.mjs --replace   已存在时覆盖正文
 *
 * body 是 localized richText（不是数组），zh 直接整体覆写即可，
 * 不存在 CLAUDE.md 里说的「localized 数组必须带行 id」的坑。
 * 但正文里的配图节点引用 media id，两个语种共用同一批图片。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { api, login, requireEnv, uploadMedia } from './lib/payload-api.mjs'
import { doc, h, hr, img, list, p, quote } from './lib/lexical.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const REPLACE = args.includes('--replace')
const ASSETS = args.includes('--assets')
  ? args[args.indexOf('--assets') + 1]
  : 'D:/precision-spray-cooling-case-study-final/assets'

const SLUG = 'precision-spray-cooling-dairy-retrofit'
/** SVG 转出的 PNG 放这里，避免污染素材目录 */
const OUT_DIR = path.resolve(process.cwd(), 'photos-out', 'cases', SLUG)

/** 正文配图：key → 文件名 + 中英 alt */
const IMAGES = {
  hero: {
    file: 'hero-dairy-barn.jpg',
    en: 'Sensor-activated spray-cooling retrofit in a commercial dairy barn',
    zh: '商业牧场牛舍内的传感器触发式喷淋降温改造',
  },
  transformation: {
    file: 'control-transformation.svg',
    en: 'Legacy row-level control versus position-level precision control',
    zh: '原整排控制与改造后单位置精准控制对比',
  },
  architecture: {
    file: 'system-architecture.svg',
    en: 'Sensor-activated precision spray-cooling system architecture',
    zh: '传感器触发式精准喷淋降温系统架构',
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
    en: 'Dedicated PLC control system',
    zh: '专用 PLC 控制系统',
  },
  app: {
    file: 'mobile-operations-app.png',
    en: 'Mobile equipment-status interface',
    zh: '移动端设备状态界面',
  },
}

const EN = {
  title: 'Cooling Only Where It Matters',
  excerpt:
    'A sensor-activated, stall-level spray-cooling retrofit for a commercial dairy: presence detection at every position, plug-and-play field cabling, PLC control logic and mobile status visibility.',
  location: '',
  body: (m) =>
    doc([
      p(
        'The dairy’s existing cooling system used a single solenoid valve to control an entire row — or, in some areas, a complete barn line. Once the valve opened, every nozzle on that line sprayed at the same time, regardless of whether a cow was present at each position.',
      ),
      p('The client asked for a more precise approach:'),
      quote(
        '**Detect whether a cow is actually present at each position, and activate only the nozzle serving that occupied position.**',
      ),
      p(
        'To meet that requirement, we engineered a complete retrofit around four purpose-built elements: a dedicated sensing enclosure, a plug-and-play T-cable harness, a PLC-based control system, and a mobile operations app.',
      ),
      hr(),

      h('h2', 'The Operational Challenge'),
      p(
        'The legacy system could deliver water, but it could not direct that water according to actual cow occupancy.',
      ),
      list([
        '**Empty-position spraying:** unoccupied stalls received the same spray as occupied stalls.',
        '**Unnecessary water use:** water was consumed without contributing to animal cooling.',
        '**Additional wastewater load:** excess water ultimately increased the burden on manure and wastewater handling.',
        '**Coarse control:** the system could control a pipe section, but not an individual cow position.',
        '**Labor-intensive maintenance:** long cable runs and field wiring made installation and troubleshooting more difficult.',
      ]),
      img(m.transformation),
      hr(),

      h('h2', 'The Client Requirement'),
      list(
        [
          'Detect cow presence at each spray position.',
          'Activate spraying only where a cow is present.',
          'Withstand the humid, dusty and demanding conditions of a dairy barn.',
          'Simplify field installation and eliminate unnecessary secondary wiring.',
          'Provide centralized control and mobile visibility of system status.',
        ],
        true,
      ),
      p(
        'This was not simply a sensor installation. The sensing device, field connection, control logic, valve actuation and operator interface all had to function as one system.',
      ),
      hr(),

      h('h2', 'Our Engineered Solution'),
      h('h3', 'A complete control loop — from cow presence to nozzle activation'),
      img(m.architecture),
      p(
        'Each spray position is monitored by a dedicated sensing node. Presence signals travel through the purpose-built field harness to the PLC, where temperature, spray duration, interval and zoning rules are applied. The PLC then commands the corresponding solenoid valve and reports operating status to the mobile interface.',
      ),
      quote(
        '**Presence Detection → Field Signal → PLC Decision → Individual Valve Actuation → Operational Feedback**',
      ),

      h('h3', '1. Purpose-Built Sensing Enclosure'),
      img(m.enclosure),
      p(
        'The sensing enclosure identifies whether a cow is present at the corresponding spray position and sends that signal to the control system. This changes the minimum control unit from an entire pipe section to an individual cow position.',
      ),
      p(
        'The enclosure was designed around practical barn installation, protection and replacement requirements.',
      ),

      h('h3', '2. Plug-and-Play T-Cable Harness'),
      img(m.harness),
      p(
        'Long cable runs and numerous connection points can make conventional field wiring slow and error-prone. The dedicated T-cable harness provides standardized plug-and-play connections:',
      ),
      list([
        'no secondary field wiring;',
        'faster, more consistent installation;',
        'fewer exposed or incorrectly wired connections;',
        'easier device replacement;',
        'a cleaner path for future expansion.',
      ]),

      h('h3', '3. Dedicated PLC Control System'),
      img(m.plc),
      p(
        'The PLC receives presence signals from each position and executes the spray-cooling logic according to the dairy’s operating requirements:',
      ),
      list([
        'independent valve control by position;',
        'configurable spray duration and interval;',
        'temperature-based system enable and disable;',
        'zoned operation across the barn;',
        'continued operation of unaffected zones if a local device requires attention.',
      ]),

      h('h3', '4. Mobile Operations App'),
      img(m.app),
      p(
        'The mobile app gives managers visibility into barn conditions, equipment status and system operation. Parameters can be reviewed remotely, and abnormal device states can be narrowed to a specific area before technicians enter the barn.',
      ),
      hr(),

      h('h2', 'Delivery Approach'),
      list(
        [
          '**Site survey** — document the barn layout, existing water lines, electrical routes and control boundaries.',
          '**Control zoning** — map cow positions, sensors, valves and spray points.',
          '**Purpose-built configuration** — prepare sensing enclosures, cable harnesses and control panels for the actual barn.',
          '**Phased installation** — retrofit by zone to minimize disruption to daily operation.',
          '**System commissioning** — verify presence detection, PLC logic, valve response and timing.',
          '**Operator handover** — configure the mobile interface and train the operating team.',
        ],
        true,
      ),
      hr(),

      h('h2', 'Before and After'),
      list([
        '**Presence detection** — before: no position-level detection; after: presence is evaluated at each spray position.',
        '**Spray control** — before: entire row or barn line; after: individual occupied positions.',
        '**Field connection** — before: secondary wiring required; after: plug-and-play T-cable harness.',
        '**Control logic** — before: coarse line-level operation; after: PLC-based timing, temperature and zoning logic.',
        '**System visibility** — before: on-site inspection; after: mobile status visibility.',
        '**Troubleshooting** — before: broad manual search; after: faster localization by zone and device.',
      ]),
      hr(),

      h('h2', 'Value Delivered'),
      list([
        'Reduces spraying at unoccupied positions.',
        'Directs cooling water to the positions where it is needed.',
        'Helps reduce unnecessary wastewater entering manure-handling systems.',
        'Simplifies installation, replacement and field maintenance.',
        'Provides visible system status and configurable operating parameters.',
        'Creates a scalable foundation for future environmental and operational data integration.',
      ]),

      h('h2', 'Project Perspective'),
      p(
        'This project was not about adding another valve or sensor. It redefined the smallest controllable unit of the dairy’s cooling system.',
      ),
      p(
        'By integrating a purpose-built sensing enclosure, plug-and-play field cabling, PLC control, individual valve actuation and mobile visibility, the retrofit moved control from the **pipe level** to the **cow-position level**.',
      ),
      quote(
        '**The goal is not to make every nozzle operate. It is to make the right nozzle operate at the right position.**',
      ),
      p(
        'Project configurations vary according to barn geometry, cow-position count, existing utilities and operating requirements.',
      ),
    ]),
}

const ZH = {
  title: '只在需要的位置降温',
  excerpt:
    '为商业牧场实施的传感器触发式牛位级喷淋降温改造：逐位置检测牛只在位、即插即用现场线束、PLC 控制逻辑与移动端状态可见。',
  location: '',
  body: (m) =>
    doc([
      p(
        '牧场原有的降温系统用一个电磁阀控制一整排——部分区域甚至是一整条牛舍管线。阀门一开，该管线上的全部喷头同时喷淋，不管每个位置上是否真的有牛。',
      ),
      p('客户提出了更精准的要求：'),
      quote('**检测每个位置上是否真的有牛，只启动该位置对应的喷头。**'),
      p(
        '为满足这一要求，我们围绕四个专门设计的部件完成了整套改造：专用感应盒、即插即用 T 型线束、基于 PLC 的控制系统，以及移动端运维 App。',
      ),
      hr(),

      h('h2', '运行中的实际问题'),
      p('原系统能把水送出去，却无法按牛只实际在位情况定向送水。'),
      list([
        '**空位置照喷：**没有牛的牛床与有牛的牛床喷得一样多。',
        '**无效用水：**水被消耗掉，却没有起到给牛降温的作用。',
        '**额外废水负荷：**多余的水最终加重了粪污与废水处理的压力。',
        '**控制颗粒度粗：**系统只能控制一段管路，无法控制单个牛位。',
        '**维护费人工：**线路长、现场接线多，安装与排查都更困难。',
      ]),
      img(m.transformation),
      hr(),

      h('h2', '客户的具体要求'),
      list(
        [
          '检测每个喷淋位置上是否有牛。',
          '只在有牛的位置启动喷淋。',
          '能长期承受牛舍潮湿、粉尘大的恶劣环境。',
          '简化现场安装，取消不必要的二次接线。',
          '提供集中控制与移动端的系统状态查看。',
        ],
        true,
      ),
      p(
        '这不是单纯装几个传感器。感应设备、现场连接、控制逻辑、阀门执行与操作界面必须作为一个系统协同工作。',
      ),
      hr(),

      h('h2', '我们交付的方案'),
      h('h3', '从牛只在位到喷头启动的完整控制闭环'),
      img(m.architecture),
      p(
        '每个喷淋位置由一个独立的感应节点监测。在位信号经专用现场线束传至 PLC，由 PLC 按温度、喷淋时长、间隔与分区规则做判断，再驱动对应的电磁阀，并把运行状态上报移动端界面。',
      ),
      quote('**在位检测 → 现场信号 → PLC 判断 → 单阀执行 → 运行反馈**'),

      h('h3', '1. 专用感应盒'),
      img(m.enclosure),
      p(
        '感应盒判断对应喷淋位置上是否有牛，并把信号送给控制系统。由此，最小控制单元从「一段管路」变成了「一个牛位」。',
      ),
      p('盒体按牛舍现场的安装、防护与更换需求设计。'),

      h('h3', '2. 即插即用 T 型线束'),
      img(m.harness),
      p('线路长、接点多，会让常规现场接线既慢又容易出错。专用 T 型线束提供标准化的即插即用连接：'),
      list([
        '现场无需二次接线；',
        '安装更快、一致性更好；',
        '减少裸露接头与接错线；',
        '设备更换更方便；',
        '后续扩展路径更清晰。',
      ]),

      h('h3', '3. 专用 PLC 控制系统'),
      img(m.plc),
      p('PLC 接收各位置的在位信号，按牧场的运行要求执行喷淋降温逻辑：'),
      list([
        '按位置独立控阀；',
        '喷淋时长与间隔可调；',
        '按温度自动启停系统；',
        '牛舍分区运行；',
        '个别现场设备需要检修时，其余分区继续运行。',
      ]),

      h('h3', '4. 移动端运维 App'),
      img(m.app),
      p(
        '移动端 App 让管理者随时掌握牛舍环境、设备状态与系统运行情况。参数可远程查看，设备异常可以在技术人员进入牛舍之前先定位到具体区域。',
      ),
      hr(),

      h('h2', '实施流程'),
      list(
        [
          '**现场勘查** —— 记录牛舍布局、现有水路、电气走向与控制边界。',
          '**控制分区** —— 梳理牛位、传感器、阀门与喷淋点的对应关系。',
          '**按需配置** —— 按实际牛舍准备感应盒、线束与控制柜。',
          '**分阶段安装** —— 按分区改造，尽量不影响日常生产。',
          '**系统调试** —— 验证在位检测、PLC 逻辑、阀门响应与时序。',
          '**交付培训** —— 配置移动端界面并培训运行团队。',
        ],
        true,
      ),
      hr(),

      h('h2', '改造前后对比'),
      list([
        '**在位检测** —— 改造前：无位置级检测；改造后：逐个喷淋位置判断在位。',
        '**喷淋控制** —— 改造前：整排或整条管线；改造后：只喷有牛的位置。',
        '**现场连接** —— 改造前：需要二次接线；改造后：即插即用 T 型线束。',
        '**控制逻辑** —— 改造前：管线级粗控；改造后：PLC 的时序、温度与分区逻辑。',
        '**状态可见性** —— 改造前：到现场看；改造后：移动端查看状态。',
        '**故障排查** —— 改造前：大范围人工查找；改造后：按分区与设备快速定位。',
      ]),
      hr(),

      h('h2', '交付价值'),
      list([
        '减少空置位置的无效喷淋。',
        '把降温用水送到真正需要的位置。',
        '有助于减少进入粪污处理系统的多余废水。',
        '简化安装、更换与现场维护。',
        '系统状态可见，运行参数可调。',
        '为后续接入环境与运行数据打下可扩展的基础。',
      ]),

      h('h2', '项目回顾'),
      p('这个项目要解决的不是多加一个阀或一个传感器，而是重新定义了牧场降温系统的最小可控单元。'),
      p(
        '把专用感应盒、即插即用现场线缆、PLC 控制、单阀执行与移动端可见性整合起来后，控制粒度从**管路级**下沉到了**牛位级**。',
      ),
      quote('**目标不是让每个喷头都动，而是让对的喷头在对的位置动。**'),
      p('具体配置因牛舍结构、牛位数量、现有水电条件与运行要求而异。'),
    ]),
}

/** SVG 先转 1600px 宽的 PNG（Media 只做位图处理，直传 SVG 会按内在尺寸栅格化） */
async function resolveAsset(file) {
  const src = path.join(ASSETS, file)
  if (!/\.svg$/i.test(file)) {
    await fs.access(src)
    return src
  }
  const out = path.join(OUT_DIR, file.replace(/\.svg$/i, '.png'))
  await fs.mkdir(OUT_DIR, { recursive: true })
  await sharp(src, { density: 200 }).resize({ width: 1600 }).png().toFile(out)
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

  const found = await api(
    `/api/case-studies?where[slug][equals]=${SLUG}&limit=1&locale=en&depth=0`,
  )
  const existing = found.docs?.[0]
  if (existing && !REPLACE) {
    console.error(`\n✗ 案例已存在（id ${existing.id}），加 --replace 才会覆盖正文。`)
    if (!DRY) process.exit(1)
  }

  // 行业：智慧水务/农业创新里取农业创新（牧场）
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
    console.log(`将${existing ? '覆盖' : '创建'}案例：${SLUG}`)
    console.log(`  EN：${EN.title}`)
    console.log(`  ZH：${ZH.title}`)
    console.log(`  配图：${Object.keys(IMAGES).length} 张（其中 2 张 SVG 会转 PNG）`)
    console.log(`  所属行业：${industryId ? 'agricultural-innovation' : '（无）'}`)
    console.log(`  关联产品：${relatedProducts.length} 个 —— ${relatedSlugs.join(', ')}`)
    console.log('\n未填字段（后台补）：项目地点、交付时间、成果指标。')
    console.log('这是空跑，没有写入任何数据。')
    return
  }

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
    body: EN.body(media),
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

  await api(`/api/case-studies/${id}?locale=zh`, {
    method: 'PATCH',
    body: { title: ZH.title, excerpt: ZH.excerpt, body: ZH.body(media) },
  })
  console.log('✓ 已写入 zh 内容')

  // 自检：en 没被 zh 覆盖
  const checkEn = await api(`/api/case-studies/${id}?locale=en&depth=0`)
  if (checkEn.title !== EN.title) {
    console.error('⚠️ en 标题被覆盖了，检查 zh PATCH 的字段范围')
    process.exit(1)
  }
  console.log(`自检通过：en 标题仍为「${checkEn.title}」`)
  console.log(`\n前台地址：${base}/en/cases/${SLUG}　|　${base}/zh/cases/${SLUG}`)
  console.log('后台待补：项目地点、交付时间（月）、成果指标（有实测数据再填）。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
