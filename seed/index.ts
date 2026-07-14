// 独立脚本运行时手动加载 .env（dev server 之外没有 Next 帮我们注入）
import 'dotenv/config'

import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

/**
 * 演示数据种子脚本 —— 用法：pnpm seed
 *
 * 幂等：已有数据（按 slug/邮箱判断）时跳过，不会重复创建。
 * 内容与设计稿一致：6 个精选产品、5 个应用行业、2 张授权证书、
 * 站点设置默认值，以及首个管理员账号。
 * 图片为程序生成的占位图（上线前在后台媒体库替换为实拍图即可）。
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.join(dirname, '.assets') // 临时生成目录（已 gitignore）

/** XML 转义（SVG 文本节点里的 & < > 必须转义） */
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 生成一张深蓝工业风占位图并返回文件路径 */
async function makePlaceholder(name: string, label: string, w = 1280, h = 960): Promise<string> {
  fs.mkdirSync(ASSETS_DIR, { recursive: true })
  const file = path.join(ASSETS_DIR, `${name}.png`)
  if (fs.existsSync(file)) return file
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#123162"/><stop offset="1" stop-color="#0F2A54"/>
      </linearGradient>
      <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M36 0H0V36" fill="none" stroke="#1e3a6b" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#grid)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="${Math.round(w / 28)}" fill="#8FB4F5" letter-spacing="3">${escapeXml(label)}</text>
  </svg>`
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file)
  return file
}

async function run() {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  /* ---------- 1. 首个管理员 ---------- */
  const { totalDocs: userCount } = await payload.count({ collection: 'users' })
  if (userCount === 0) {
    await payload.create({
      collection: 'users',
      data: { name: 'Admin', email: 'admin@example.com', password: 'changeme-123456' },
    })
    log('管理员已创建：admin@example.com / changeme-123456（请立即修改密码）')
  }

  /* ---------- 2. 站点设置 ---------- */
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      companyName: 'Tianjin Donglin Zhongkong Automation Technology Co., Ltd.',
      contact: {
        email: 'sales@donglin-controls.com',
        phone: '+86 22 0000 0000',
        location: 'Tianjin, China',
        whatsAppNumber: '8613800000000',
      },
    },
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { companyName: '天津东林众控自动化科技有限公司', contact: { location: '中国·天津' } },
    locale: 'zh',
  })
  log('站点设置已写入')

  /* ---------- 3. 媒体上传辅助 ---------- */
  async function uploadMedia(name: string, altEn: string, altZh: string, w?: number, h?: number) {
    const filePath = await makePlaceholder(name, altEn.toUpperCase(), w, h)
    const doc = await payload.create({
      collection: 'media',
      data: { alt: altEn },
      filePath,
      locale: 'en',
    })
    await payload.update({ collection: 'media', id: doc.id, data: { alt: altZh }, locale: 'zh' })
    return doc.id
  }

  /* ---------- 4. 产品分类 ---------- */
  const categories: Array<{ slug: string; en: string; zh: string }> = [
    { slug: 'control-cabinets', en: 'PLC Control Cabinets', zh: 'PLC 控制柜' },
    { slug: 'hmi', en: 'HMI Systems', zh: '人机界面（HMI）' },
    { slug: 'drives', en: 'Drives & Motor Control', zh: '变频与电机控制' },
    { slug: 'scada', en: 'SCADA & Monitoring', zh: 'SCADA 与远程监控' },
    { slug: 'water-treatment', en: 'Water Treatment Automation', zh: '水处理自动化' },
  ]
  const categoryIds: Record<string, number> = {}
  for (const cat of categories) {
    const existing = await payload.find({
      collection: 'product-categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      categoryIds[cat.slug] = existing.docs[0].id
      continue
    }
    const doc = await payload.create({
      collection: 'product-categories',
      data: { name: cat.en, slug: cat.slug },
      locale: 'en',
    })
    await payload.update({
      collection: 'product-categories',
      id: doc.id,
      data: { name: cat.zh },
      locale: 'zh',
    })
    categoryIds[cat.slug] = doc.id
  }
  log(`产品分类就绪（${categories.length} 个）`)

  /* ---------- 5. 精选产品（与设计稿一致的 6 个） ---------- */
  const products = [
    {
      slug: 'plc-control-cabinets',
      category: 'control-cabinets',
      en: {
        title: 'PLC Control Cabinets',
        excerpt:
          'Custom-engineered cabinets with ABB or Schneider PLCs, fully wired, tested, and documented.',
      },
      zh: {
        title: 'PLC 控制柜',
        excerpt: '基于 ABB 或施耐德 PLC 定制设计，整柜配线、测试并附完整文档。',
      },
      specs: [
        { en: ['PLC Brand', 'ABB / Schneider Electric'], zh: ['PLC 品牌', 'ABB / 施耐德电气'] },
        { en: ['Enclosure Rating', 'IP54 (higher on request)'], zh: ['防护等级', 'IP54（可按需提高）'] },
      ],
    },
    {
      slug: 'hmi-touch-panels',
      category: 'hmi',
      en: {
        title: 'HMI Touch Panels',
        excerpt:
          'Operator interfaces with intuitive screen design, alarms, trending, and multi-language support.',
      },
      zh: {
        title: 'HMI 触摸屏',
        excerpt: '直观的画面设计，支持报警、趋势曲线与多语言操作界面。',
      },
      specs: [],
    },
    {
      slug: 'vfd-drive-panels',
      category: 'drives',
      en: {
        title: 'VFD Drive Panels',
        excerpt:
          'Variable-frequency drive systems for pumps, fans, and conveyors — sized for your load profile.',
      },
      zh: {
        title: '变频驱动柜',
        excerpt: '面向泵、风机与输送设备的变频系统，按负载工况选型。',
      },
      specs: [],
    },
    {
      slug: 'water-treatment-automation',
      category: 'water-treatment',
      en: {
        title: 'Water Treatment Automation',
        excerpt:
          'Complete automation for treatment plants: dosing, filtration, SCADA, and remote monitoring.',
      },
      zh: {
        title: '水处理自动化',
        excerpt: '水厂全套自动化：加药、过滤、SCADA 与远程监控。',
      },
      specs: [],
    },
    {
      slug: 'motor-control-centers',
      category: 'drives',
      en: {
        title: 'Motor Control Centers',
        excerpt: 'MCC assemblies with intelligent protection, soft starters, and energy monitoring.',
      },
      zh: {
        title: '电机控制中心（MCC）',
        excerpt: '集成智能保护、软启动与能耗监测的 MCC 成套设备。',
      },
      specs: [],
    },
    {
      slug: 'scada-remote-monitoring',
      category: 'scada',
      en: {
        title: 'SCADA & Remote Monitoring',
        excerpt: 'Plant-wide supervision with historian, reporting, and secure remote access.',
      },
      zh: {
        title: 'SCADA 与远程监控',
        excerpt: '全厂级监控：历史数据库、报表与安全远程访问。',
      },
      specs: [],
    },
  ]

  for (const p of products) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })
    if (existing.docs[0]) continue

    const imageId = await uploadMedia(`prod-${p.slug}`, p.en.title, p.zh.title)
    const doc = await payload.create({
      collection: 'products',
      data: {
        title: p.en.title,
        slug: p.slug,
        excerpt: p.en.excerpt,
        images: [{ image: imageId }],
        specs: p.specs.map((s) => ({ label: s.en[0], value: s.en[1] })),
        category: categoryIds[p.category],
        featured: true,
      },
      locale: 'en',
    })
    // 中文翻译必须复用 en 创建时生成的行 id，否则数组会被重建、英文值丢失
    await payload.update({
      collection: 'products',
      id: doc.id,
      data: {
        title: p.zh.title,
        excerpt: p.zh.excerpt,
        specs: (doc.specs ?? []).map((row, i) => ({
          ...row,
          label: p.specs[i]?.zh[0] ?? row.label,
          value: p.specs[i]?.zh[1] ?? row.value,
        })),
      },
      locale: 'zh',
    })
  }
  log(`精选产品就绪（${products.length} 个）`)

  /* ---------- 6. 应用行业（与设计稿一致的 5 个） ---------- */
  const industries = [
    {
      slug: 'smart-water',
      order: 1,
      en: { name: 'Smart Water Management', tagline: 'Treatment · Pumping · SCADA' },
      zh: { name: '智慧水务', tagline: '水处理 · 泵站 · SCADA' },
    },
    {
      slug: 'advanced-manufacturing',
      order: 2,
      en: { name: 'Advanced Manufacturing', tagline: 'Lines · Robotics · MES' },
      zh: { name: '先进制造', tagline: '产线 · 机器人 · MES' },
    },
    {
      slug: 'new-energy',
      order: 3,
      en: { name: 'New Energy', tagline: 'Solar · Storage · EV' },
      zh: { name: '新能源', tagline: '光伏 · 储能 · 充电' },
    },
    {
      slug: 'agriculture',
      order: 4,
      en: { name: 'Agriculture', tagline: 'Irrigation · Greenhouses' },
      zh: { name: '现代农业', tagline: '灌溉 · 智慧温室' },
    },
    {
      slug: 'traditional-industry',
      order: 5,
      en: { name: 'Traditional Industry', tagline: 'Chemical · Metals · Cement' },
      zh: { name: '传统工业', tagline: '化工 · 冶金 · 水泥' },
    },
  ]

  for (const ind of industries) {
    const existing = await payload.find({
      collection: 'application-scenarios',
      where: { slug: { equals: ind.slug } },
      limit: 1,
    })
    if (existing.docs[0]) continue

    const imageId = await uploadMedia(`ind-${ind.slug}`, ind.en.name, ind.zh.name, 800, 600)
    const doc = await payload.create({
      collection: 'application-scenarios',
      data: {
        name: ind.en.name,
        slug: ind.slug,
        tagline: ind.en.tagline,
        image: imageId,
        displayOrder: ind.order,
      },
      locale: 'en',
    })
    await payload.update({
      collection: 'application-scenarios',
      id: doc.id,
      data: { name: ind.zh.name, tagline: ind.zh.tagline },
      locale: 'zh',
    })
  }
  log(`应用行业就绪（${industries.length} 个）`)

  /* ---------- 7. 授权证书 ---------- */
  const certificates = [
    {
      key: 'abb-authorization',
      en: { name: 'ABB Authorized Distributor Certificate', issuer: 'ABB' },
      zh: { name: 'ABB 授权代理证书', issuer: 'ABB' },
    },
    {
      key: 'schneider-authorization',
      en: { name: 'Schneider Electric Authorized Partner Certificate', issuer: 'Schneider Electric' },
      zh: { name: '施耐德电气授权合作伙伴证书', issuer: '施耐德电气' },
    },
  ]
  const { totalDocs: certCount } = await payload.count({ collection: 'certificates' })
  if (certCount === 0) {
    for (const cert of certificates) {
      const imageId = await uploadMedia(`cert-${cert.key}`, cert.en.name, cert.zh.name, 900, 1200)
      const doc = await payload.create({
        collection: 'certificates',
        data: {
          name: cert.en.name,
          issuer: cert.en.issuer,
          image: imageId,
          type: 'authorization',
        },
        locale: 'en',
      })
      await payload.update({
        collection: 'certificates',
        id: doc.id,
        data: { name: cert.zh.name, issuer: cert.zh.issuer },
        locale: 'zh',
      })
    }
  }
  log(`授权证书就绪（${certificates.length} 张）`)

  /** 拼一个最小的 Lexical 富文本段落 */
  const richTextOf = (text: string) => ({
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '' as const,
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text }],
        },
      ],
    },
  })

  /* ---------- 8. 固定页示例（About Us：richText + statsGrid + ctaBanner + 证书墙） ---------- */
  const { totalDocs: pageCount } = await payload.count({ collection: 'pages' })
  if (pageCount === 0) {
    const aboutPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'About Us',
        slug: 'about',
        intro:
          'An authorized ABB & Schneider Electric partner, engineering complete automation systems in Tianjin since 2016.',
        layout: [
          {
            blockType: 'richText',
            content: richTextOf(
              'Tianjin Donglin Zhongkong Automation Technology Co., Ltd. designs, builds, and commissions industrial automation systems for customers worldwide. Our 30-engineer team covers software, electrical engineering, automation control, and industrial networking.',
            ),
          },
          {
            blockType: 'statsGrid',
            stats: [
              { value: '2016', label: 'Founded in Tianjin' },
              { value: '30+', label: 'In-house engineers' },
              { value: '4', label: 'Engineering divisions' },
              { value: '5', label: 'Industries served' },
            ],
          },
          { blockType: 'imageGallery', heading: 'Certificates & Authorizations', fromCertificates: true },
          {
            blockType: 'ctaBanner',
            heading: 'Ready to start your project?',
            body: 'Send us your requirements and an engineer will reply within one business day.',
            buttonLabel: 'Request a Quote',
          },
          { blockType: 'contactForm', heading: 'Tell us about your project' },
        ],
      },
      locale: 'en',
    })
    // 中文翻译：blocks 数组本身不做 localized（结构共享），只翻译内部 localized 字段。
    // 必须带上 en 创建时生成的 block id / 行 id，否则会重建数组、丢失英文内容。
    const layout = aboutPage.layout ?? []
    const statsBlock = layout.find((b) => b.blockType === 'statsGrid')
    const zhStats = ['创立于天津', '自有工程师', '工程事业部', '服务行业']
    await payload.update({
      collection: 'pages',
      id: aboutPage.id,
      data: {
        title: '关于我们',
        intro: 'ABB 与施耐德电气授权合作伙伴，自 2016 年起在天津交付成套自动化系统。',
        layout: layout.map((block) => {
          switch (block.blockType) {
            case 'richText':
              return {
                ...block,
                content: richTextOf(
                  '天津东林众控自动化科技有限公司为全球客户设计、制造并调试工业自动化系统。30 余人的工程师团队覆盖软件开发、电气工程、自动化控制与工业网络四大方向。',
                ),
              }
            case 'statsGrid':
              return {
                ...block,
                stats: (statsBlock?.blockType === 'statsGrid' ? statsBlock.stats ?? [] : []).map(
                  (stat, i) => ({ ...stat, label: zhStats[i] ?? stat.label }),
                ),
              }
            case 'imageGallery':
              return { ...block, heading: '资质与授权' }
            case 'ctaBanner':
              return {
                ...block,
                heading: '准备好启动您的项目了吗？',
                body: '把需求发给我们，工程师将在一个工作日内回复。',
                buttonLabel: '获取报价',
              }
            case 'contactForm':
              return { ...block, heading: '告诉我们您的项目' }
            default:
              return block
          }
        }),
      },
      locale: 'zh',
    })
    log('固定页示例（about）已创建')
  }

  /* ---------- 9. 客户案例示例（二期） ---------- */
  const { totalDocs: caseCount } = await payload.count({ collection: 'case-studies' })
  if (caseCount === 0) {
    /** 按 slug 找已 seed 的行业 / 产品 id */
    const findId = async (collection: 'application-scenarios' | 'products', slug: string) => {
      const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
      return docs[0]?.id
    }

    const caseSeeds = [
      {
        slug: 'municipal-wtp-scada-upgrade',
        industry: 'smart-water',
        products: ['plc-control-cabinets', 'scada-remote-monitoring'],
        completedAt: '2025-11-01',
        en: {
          title: 'SCADA & PLC upgrade for a 50,000 m³/d municipal water treatment plant',
          excerpt:
            'Full control-system retrofit — 4 PLC cabinets, redundant SCADA and remote monitoring — commissioned without interrupting supply.',
          location: 'Hebei, China',
          metrics: [
            ['50,000 m³/d', 'Plant capacity'],
            ['4', 'PLC cabinets delivered'],
            ['0 h', 'Supply interruption'],
            ['30%', 'Fewer manual operations'],
          ],
          body: 'The plant operated on an aging control system with frequent failures and no remote visibility. We engineered and built four ABB PLC cabinets, deployed a redundant SCADA layer with historian and alarming, and migrated the plant section by section during live operation. The operator now supervises the full process remotely, with automatic dosing control and shift reports.',
        },
        zh: {
          title: '5 万吨/日市政水厂 SCADA 与 PLC 控制系统升级',
          excerpt: '整套控制系统改造——4 面 PLC 控制柜、冗余 SCADA 与远程监控，不停水完成切换调试。',
          location: '中国·河北',
          metrics: [
            ['5 万吨/日', '水厂规模'],
            ['4 面', '交付 PLC 柜'],
            ['0 小时', '停水时间'],
            ['30%', '人工操作减少'],
          ],
          body: '该水厂原控制系统老化、故障频发且无远程可视化。我们设计制造了 4 面基于 ABB PLC 的控制柜，部署带历史库与报警的冗余 SCADA 层，并在不停产状态下分段切换。现在运营方可远程监控全流程，加药自动控制并自动生成班报。',
        },
      },
      {
        slug: 'ev-battery-line-mcc',
        industry: 'new-energy',
        products: ['motor-control-centers', 'vfd-drive-panels'],
        completedAt: '2026-03-01',
        en: {
          title: 'MCC and drive systems for an EV battery materials production line',
          excerpt:
            'Motor control centers and VFD panels for a new cathode-materials line — 120 motors, energy monitoring, delivered in 8 weeks.',
          location: 'Tianjin, China',
          metrics: [
            ['120', 'Motors controlled'],
            ['8 weeks', 'Design to delivery'],
            ['12%', 'Energy savings measured'],
          ],
          body: 'For a new cathode-materials production line we delivered the complete motor-control scope: MCC sections with intelligent protection relays, VFD panels sized per load profile, and plant-wide energy monitoring integrated into the customer MES. The line started on schedule and measured double-digit energy savings against the design baseline.',
        },
        zh: {
          title: '动力电池材料产线 MCC 与传动系统',
          excerpt: '新建正极材料产线的电机控制中心与变频柜——120 台电机、能耗监测，8 周交付。',
          location: '中国·天津',
          metrics: [
            ['120 台', '受控电机'],
            ['8 周', '设计到交付'],
            ['12%', '实测节能'],
          ],
          body: '为新建正极材料产线交付完整电控范围：带智能保护继电器的 MCC 柜列、按负载工况选型的变频柜，以及接入客户 MES 的全厂能耗监测。产线按期投产，实测能耗较设计基线节省两位数。',
        },
      },
    ]

    for (const c of caseSeeds) {
      const coverId = await uploadMedia(`case-${c.slug}`, c.en.title, c.zh.title, 1280, 800)
      const industryId = await findId('application-scenarios', c.industry)
      const productIds = (
        await Promise.all(c.products.map((p) => findId('products', p)))
      ).filter((id): id is number => Boolean(id))

      const doc = await payload.create({
        collection: 'case-studies',
        data: {
          title: c.en.title,
          slug: c.slug,
          excerpt: c.en.excerpt,
          coverImage: coverId,
          industry: industryId,
          relatedProducts: productIds,
          location: c.en.location,
          completedAt: c.completedAt,
          metrics: c.en.metrics.map(([value, label]) => ({ value, label })),
          body: richTextOf(c.en.body),
        },
        locale: 'en',
      })
      // 中文翻译：localized 数组必须复用 en 行 id
      await payload.update({
        collection: 'case-studies',
        id: doc.id,
        data: {
          title: c.zh.title,
          excerpt: c.zh.excerpt,
          location: c.zh.location,
          metrics: (doc.metrics ?? []).map((row, i) => ({
            ...row,
            value: c.zh.metrics[i]?.[0] ?? row.value,
            label: c.zh.metrics[i]?.[1] ?? row.label,
          })),
          body: richTextOf(c.zh.body),
        },
        locale: 'zh',
      })
    }
    log(`客户案例就绪（${caseSeeds.length} 个）`)
  }

  /* ---------- 10. 博客文章示例（二期） ---------- */
  const { totalDocs: postCount } = await payload.count({ collection: 'posts' })
  if (postCount === 0) {
    const postSeeds = [
      {
        slug: 'how-to-spec-plc-control-cabinet',
        publishedAt: '2026-05-12T08:00:00.000Z',
        en: {
          title: 'How to specify a PLC control cabinet: a practical checklist',
          excerpt:
            'I/O count, enclosure rating, thermal design, spare capacity — the eight questions we ask before quoting any cabinet.',
          body: 'A good cabinet specification starts long before panel layout. This checklist covers the eight questions our engineers ask on every project: process I/O count and reserve, PLC brand and series constraints, enclosure rating for the installation environment, thermal load and cooling strategy, incoming power and distribution, network architecture, documentation language, and applicable standards. Answering them up front shortens quotation from weeks to days.',
        },
        zh: {
          title: 'PLC 控制柜怎么提需求：一份实用清单',
          excerpt: 'I/O 点数、防护等级、散热设计、预留容量——我们报价前必问的八个问题。',
          body: '一份好的控制柜规格书早在柜内布局之前就开始了。本清单覆盖我们的工程师在每个项目上必问的八个问题：工艺 I/O 点数与预留、PLC 品牌与系列约束、安装环境对应的防护等级、热负荷与散热策略、进线电源与配电、网络架构、文档语言以及适用标准。提前回答这些问题，报价周期能从数周缩短到数天。',
        },
      },
      {
        slug: 'abb-vs-schneider-plc-selection',
        publishedAt: '2026-06-20T08:00:00.000Z',
        en: {
          title: 'ABB or Schneider for your next PLC project? An integrator’s view',
          excerpt:
            'Both ecosystems are excellent — the right choice depends on your installed base, regional support and application profile.',
          body: 'As an authorized partner of both brands we are often asked which PLC to standardize on. The honest answer: both platforms cover the vast majority of industrial applications well. The decision usually comes down to your existing installed base and spare-parts stock, the regional service network at your plant locations, engineering-tool licensing, and specific application requirements such as motion, redundancy or safety integration. This article walks through each factor with examples from delivered projects.',
        },
        zh: {
          title: '下个 PLC 项目选 ABB 还是施耐德？集成商视角',
          excerpt: '两个生态都很优秀——正确选择取决于你的存量设备、区域服务与应用场景。',
          body: '作为两个品牌的授权合作伙伴，我们经常被问到应该以哪家 PLC 为标准。诚实的回答是：两个平台都能很好地覆盖绝大多数工业应用。决策通常取决于存量设备与备件库存、工厂所在地的区域服务网络、工程软件授权成本，以及运动控制、冗余或安全集成等具体应用需求。本文结合已交付项目逐项分析。',
        },
      },
    ]

    for (const p of postSeeds) {
      const coverId = await uploadMedia(`post-${p.slug}`, p.en.title, p.zh.title, 1280, 720)
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: p.en.title,
          slug: p.slug,
          excerpt: p.en.excerpt,
          coverImage: coverId,
          publishedAt: p.publishedAt,
          body: richTextOf(p.en.body),
        },
        locale: 'en',
      })
      await payload.update({
        collection: 'posts',
        id: doc.id,
        data: { title: p.zh.title, excerpt: p.zh.excerpt, body: richTextOf(p.zh.body) },
        locale: 'zh',
      })
    }
    log(`博客文章就绪（${postSeeds.length} 篇）`)
  }

  log('全部完成 ✔')
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] 失败:', err)
  process.exit(1)
})
