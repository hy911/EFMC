/**
 * Payload REST API 的公共封装，供 scripts/ 下各导入脚本复用。
 *
 * 凭据来源，按优先级：
 *   1. 命令行前缀的环境变量（PAYLOAD_URL=... node scripts/xxx.mjs）
 *   2. 项目根的 .env.import（推荐；已 gitignore，不进仓库）
 *   3. 项目根的 .env
 * 读到后不打印、不落盘。已存在的环境变量不会被文件覆盖，
 * 所以「平时用文件里的生产站，临时改本地」只要在命令前加一次变量即可。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'

// override: false —— 命令行传进来的优先，文件只补缺失的
for (const file of ['.env.import', '.env']) {
  dotenv.config({ path: path.resolve(process.cwd(), file), override: false, quiet: true })
}

const URL_BASE = (process.env.PAYLOAD_URL || '').replace(/\/$/, '')
const EMAIL = process.env.PAYLOAD_EMAIL
const PASSWORD = process.env.PAYLOAD_PASSWORD

let token = ''

export function requireEnv() {
  if (!URL_BASE || !EMAIL || !PASSWORD) {
    console.error(`缺少凭据。在项目根建 .env.import（已 gitignore），内容：

  PAYLOAD_URL=https://efmc-automation.com
  PAYLOAD_EMAIL=你的后台账号
  PAYLOAD_PASSWORD=你的后台密码

照 .env.import.example 抄一份改掉即可。临时换目标站点就在命令前加：
  PAYLOAD_URL=http://localhost:3000 node scripts/xxx.mjs`)
    process.exit(1)
  }
  return URL_BASE
}

export async function api(pathname, { method = 'GET', body, headers = {}, raw } = {}) {
  const res = await fetch(`${URL_BASE}${pathname}`, {
    method,
    headers: {
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(raw ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || json?.message || text.slice(0, 300)
    throw new Error(`${method} ${pathname} → ${res.status}: ${msg}`)
  }
  return json
}

export async function login() {
  const r = await api('/api/users/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  })
  token = r.token
  console.log(`已登录：${r.user?.email ?? '(未知账号)'}`)
  return r.user
}

/** 拼最小 Lexical 富文本（多段落），与 seed/index.ts 的 richTextOf 一致 */
export const richTextOf = (paragraphs) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((text) => ({
      type: 'paragraph',
      version: 1,
      children: [{ type: 'text', version: 1, text }],
    })),
  },
})

/** 上传图片到 media（中英 alt 各写一遍），返回 media id */
/**
 * 上传一张图并写好中英 alt。
 * focal 传 [x, y]（0–100 的百分比）时一并写入焦点 —— 被 object-cover 裁切的位置
 * 由它决定，不给就居中裁。焦点是图片自身的属性，所有引用处共用。
 */
export async function uploadMedia(filePath, altEn, altZh, focal) {
  const buf = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const type = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg'
  const form = new FormData()
  form.append('file', new Blob([buf], { type }), name)
  form.append(
    '_payload',
    JSON.stringify({
      alt: altEn,
      ...(focal ? { focalX: focal[0], focalY: focal[1] } : {}),
    }),
  )
  const created = await api('/api/media?locale=en', { method: 'POST', raw: form })
  const id = created.doc.id
  await api(`/api/media/${id}?locale=zh`, { method: 'PATCH', body: { alt: altZh } })
  return id
}

/** 名称归一化：忽略大小写、首尾与内部多余空白 */
export const normalizeName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
