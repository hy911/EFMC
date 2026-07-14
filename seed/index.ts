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
    await payload.update({
      collection: 'products',
      id: doc.id,
      data: {
        title: p.zh.title,
        excerpt: p.zh.excerpt,
        specs: p.specs.map((s) => ({ label: s.zh[0], value: s.zh[1] })),
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

  log('全部完成 ✔')
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] 失败:', err)
  process.exit(1)
})
