#!/usr/bin/env node
/**
 * 导入 About 页（Pages collection，slug=about）的完整中英内容。
 *
 * 用法：
 *   node scripts/import-about.mjs --dry-run    只打印将写入什么
 *   node scripts/import-about.mjs --replace    覆盖现有 layout（会丢失后台已拼的积木块）
 *   node scripts/import-about.mjs              页面不存在则创建；已有 layout 则拒绝，避免误覆盖
 *
 * 图片相关的积木块（团队照/柜体实拍画廊、供应商 logo 横条）不在本脚本内，
 * 素材齐了在后台补即可。证书墙同理（业主确认现有证书不予展示）。
 *
 * localized 数组（layout 及其内部 columns/items/stats）写 zh 时必须带原有行 id，
 * 否则数组会被重建、en 内容全丢 —— 见 CLAUDE.md。
 */
import { api, login, requireEnv, richTextOf } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const REPLACE = args.includes('--replace')

const EN = {
  title: 'About Us',
  intro:
    'Established in 2016 in Tianjin, we design and build industrial control systems for customers worldwide — from electrical drawings to commissioned plant.',
  profile: [
    "Established in 2016 and headquartered in Tianjin, a hub of China's industrial sector, Tianjin Donglin Zhongkong Automation Technology Co., Ltd. operates with a registered capital of 4 million RMB (paid-up capital: 1.085 million RMB).",
    'As an innovator in electrical automation and industrial intelligence, the company integrates IoT and AI technologies to focus on R&D and application of industrial control systems and digital solutions, providing global clients with end-to-end technical services from hardware design to software integration.',
  ],
  stats: [
    { value: '15', label: 'Software copyrights' },
    { value: '2', label: 'Administrative licenses' },
    { value: '2', label: 'Bidding projects' },
  ],
  deliverHeading: 'What we deliver',
  deliverColumns: [
    {
      title: 'Industrial-grade electrical control equipment',
      items: [
        { text: 'PLC control cabinets and high/low-voltage power distribution systems' },
        { text: 'Explosion-proof, AI-enabled and cloud server-integrated cabinets' },
      ],
    },
    {
      title: 'Digital software services',
      items: [
        { text: 'PLC programming and cloud platform development' },
        { text: 'WinCC/HMI interface design and customized industrial APP development' },
        { text: 'AI industrial algorithm deployment' },
      ],
    },
    {
      title: 'Integrated innovation solutions',
      items: [
        { text: 'Equipment data acquisition and cloud communication systems' },
        { text: 'Remote operation and maintenance platforms' },
        { text: 'Smart factory transformation services' },
      ],
    },
  ],
  teamHeading: 'How the team works',
  teamColumns: [
    {
      title: 'Streamlined coordination',
      items: [{ text: 'Cross-department coordination with clearly defined roles' }],
    },
    {
      title: 'Industry-leading efficiency',
      items: [{ text: 'Operational efficiency accelerating response to automation demands' }],
    },
    {
      title: 'Full-spectrum solutions',
      items: [{ text: 'Technical solutions from concept design to implementation' }],
    },
  ],
  certHeading: 'Certificates',
  ctaHeading: 'Tell us what you need to control.',
  ctaBody:
    'Send us your process description, I/O list or single-line diagram — we will come back with a detailed quotation and bill of materials.',
  ctaButton: 'Request a Quote',
  formHeading: 'Tell us about your project',
}

const ZH = {
  title: '关于我们',
  intro: '公司成立于 2016 年，总部位于天津，为全球客户设计并交付工业控制系统——从电气图纸到现场调试。',
  profile: [
    '天津东林众控自动化科技有限公司成立于 2016 年，总部位于中国工业重镇天津，注册资本 400 万元人民币（实缴 108.5 万元）。',
    '公司深耕电气自动化与工业智能领域，融合物联网与人工智能技术，专注于工业控制系统与数字化解决方案的研发与应用，为全球客户提供从硬件设计到软件集成的一站式技术服务。',
  ],
  stats: [
    { value: '15', label: '项软件著作权' },
    { value: '2', label: '项行政许可' },
    { value: '2', label: '个中标项目' },
  ],
  deliverHeading: '我们交付什么',
  deliverColumns: [
    {
      title: '工业级电气控制设备',
      items: [{ text: 'PLC 控制柜与高低压配电系统' }, { text: '防爆柜、AI 控制柜与云服务器一体柜' }],
    },
    {
      title: '数字化软件服务',
      items: [
        { text: 'PLC 编程与云平台开发' },
        { text: 'WinCC/HMI 人机界面设计与工业 APP 定制开发' },
        { text: '工业 AI 算法部署' },
      ],
    },
    {
      title: '集成创新解决方案',
      items: [
        { text: '设备数据采集与云通信系统' },
        { text: '远程运维平台' },
        { text: '智慧工厂改造服务' },
      ],
    },
  ],
  teamHeading: '团队如何协作',
  teamColumns: [
    { title: '高效协同', items: [{ text: '跨部门协作，职责边界清晰' }] },
    { title: '行业领先效率', items: [{ text: '快速响应自动化需求' }] },
    { title: '全链路技术方案', items: [{ text: '从概念设计到落地实施' }] },
  ],
  certHeading: '资质证书',
  ctaHeading: '告诉我们您要控制什么。',
  ctaBody: '发送工艺说明、I/O 清单或单线图，我们将回复详细报价与物料清单。',
  ctaButton: '获取报价',
  formHeading: '介绍一下您的项目',
}

/** 组装 en 版 layout；hasCerts=false 时不放证书墙（否则只剩一个空标题） */
const layoutEn = (hasCerts) => [
  { blockType: 'richText', content: richTextOf(EN.profile) },
  { blockType: 'statsGrid', stats: EN.stats },
  { blockType: 'featureColumns', heading: EN.deliverHeading, columns: EN.deliverColumns },
  { blockType: 'featureColumns', heading: EN.teamHeading, columns: EN.teamColumns },
  // 证书墙：勾选 fromCertificates 后自动拉取 Certificates collection 的全部证书
  ...(hasCerts
    ? [{ blockType: 'imageGallery', heading: EN.certHeading, fromCertificates: true }]
    : []),
  {
    blockType: 'ctaBanner',
    heading: EN.ctaHeading,
    body: EN.ctaBody,
    buttonLabel: EN.ctaButton,
  },
  { blockType: 'contactForm', heading: EN.formHeading },
]

/**
 * 按 en 回读的 layout 逐块生成 zh 版本：带上每一层的行 id。
 * 两个 featureColumns 按出现顺序分别对应 deliver / team。
 */
function layoutZh(enLayout) {
  let fcSeen = 0
  return enLayout.map((block) => {
    switch (block.blockType) {
      case 'richText':
        return { ...block, content: richTextOf(ZH.profile) }
      case 'statsGrid':
        return {
          ...block,
          stats: (block.stats ?? []).map((s, i) => ({ ...s, ...(ZH.stats[i] ?? {}) })),
        }
      case 'featureColumns': {
        const src = fcSeen++ === 0 ? ZH.deliverColumns : ZH.teamColumns
        const heading = fcSeen === 1 ? ZH.deliverHeading : ZH.teamHeading
        return {
          ...block,
          heading,
          columns: (block.columns ?? []).map((col, i) => ({
            ...col,
            title: src[i]?.title ?? col.title,
            items: (col.items ?? []).map((item, j) => ({
              ...item,
              text: src[i]?.items?.[j]?.text ?? item.text,
            })),
          })),
        }
      }
      case 'imageGallery':
        return { ...block, heading: ZH.certHeading }
      case 'ctaBanner':
        return { ...block, heading: ZH.ctaHeading, body: ZH.ctaBody, buttonLabel: ZH.ctaButton }
      case 'contactForm':
        return { ...block, heading: ZH.formHeading }
      default:
        return block
    }
  })
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)
  await login()

  const certs = await api('/api/certificates?limit=1&locale=en&depth=0')
  const hasCerts = (certs.totalDocs ?? 0) > 0
  console.log(
    hasCerts
      ? `站上已有 ${certs.totalDocs} 张证书，会放入证书墙区块`
      : '站上暂无证书，本次不放证书墙区块（导入证书后重跑即可加上）',
  )

  const found = await api('/api/pages?where[slug][equals]=about&limit=1&locale=en')
  const existing = found.docs?.[0]
  const existingBlocks = existing?.layout?.length ?? 0

  if (existing) {
    console.log(`已存在 About 页（id ${existing.id}），当前 ${existingBlocks} 个积木块`)
    console.log(`  en 标题：${existing.title || '（空 —— 本次会补上）'}`)
    if (existingBlocks > 0 && !REPLACE) {
      const msg = `该页面已经有 ${existingBlocks} 个积木块，继续会整体覆盖，后台已拼的内容会丢失。确认要覆盖就加 --replace。`
      // 空跑不写数据，只提示；真跑才拦住
      if (DRY) {
        console.warn(`\n⚠️ ${msg}\n`)
      } else {
        console.error(`\n✗ ${msg}\n  只想看会写什么用 --dry-run。`)
        process.exit(1)
      }
    }
  } else {
    console.log('About 页不存在，将新建')
  }

  const en = layoutEn(hasCerts)
  if (DRY) {
    console.log(`\n将写入 ${en.length} 个积木块：`)
    en.forEach((b, i) => console.log(`  ${i + 1}. ${b.blockType}${b.heading ? ` — ${b.heading}` : ''}`))
    console.log(`\nen 标题：${EN.title}　|　zh 标题：${ZH.title}`)
    console.log('这是空跑，没有写入任何数据。')
    return
  }

  let id
  if (existing) {
    const r = await api(`/api/pages/${existing.id}?locale=en`, {
      method: 'PATCH',
      body: { title: EN.title, intro: EN.intro, layout: en },
    })
    id = r.doc.id
    console.log(`✓ 已更新 en 内容（id ${id}）`)
  } else {
    const r = await api('/api/pages?locale=en', {
      method: 'POST',
      body: { title: EN.title, slug: 'about', intro: EN.intro, layout: en },
    })
    id = r.doc.id
    console.log(`✓ 已创建 About 页（id ${id}）`)
  }

  // 回读拿到每个 block / 数组行的 id，再写 zh
  const saved = await api(`/api/pages/${id}?locale=en&depth=0`)
  await api(`/api/pages/${id}?locale=zh`, {
    method: 'PATCH',
    body: { title: ZH.title, intro: ZH.intro, layout: layoutZh(saved.layout ?? []) },
  })
  console.log('✓ 已写入 zh 内容')

  // 自检：确认 en 没有被 zh 覆盖
  const checkEn = await api(`/api/pages/${id}?locale=en&depth=0`)
  const enHeading = checkEn.layout?.find((b) => b.blockType === 'featureColumns')?.heading
  console.log(`\n自检 — en 的 featureColumns 标题：${enHeading}`)
  if (enHeading !== EN.deliverHeading) {
    console.error('⚠️ en 内容被覆盖了！检查 layoutZh 是否带上了行 id')
    process.exit(1)
  }
  console.log('自检通过：en 未被 zh 覆盖。')
  console.log('\n下一步：素材齐了在后台补图片画廊（团队照 + 柜体实拍）与 logo 横条。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
