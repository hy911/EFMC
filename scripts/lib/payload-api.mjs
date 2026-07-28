/**
 * Payload REST API 的公共封装，供 scripts/ 下各导入脚本复用。
 *
 * 凭据只从环境变量读，不打印、不落盘：
 *   PAYLOAD_URL / PAYLOAD_EMAIL / PAYLOAD_PASSWORD
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const URL_BASE = (process.env.PAYLOAD_URL || '').replace(/\/$/, '')
const EMAIL = process.env.PAYLOAD_EMAIL
const PASSWORD = process.env.PAYLOAD_PASSWORD

let token = ''

export function requireEnv() {
  if (!URL_BASE || !EMAIL || !PASSWORD) {
    console.error(`缺少环境变量。请先设置：
  PAYLOAD_URL       目标站点（如 http://localhost:3000）
  PAYLOAD_EMAIL     后台账号
  PAYLOAD_PASSWORD  后台密码`)
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
export async function uploadMedia(filePath, altEn, altZh) {
  const buf = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const type = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg'
  const form = new FormData()
  form.append('file', new Blob([buf], { type }), name)
  form.append('_payload', JSON.stringify({ alt: altEn }))
  const created = await api('/api/media?locale=en', { method: 'POST', raw: form })
  const id = created.doc.id
  await api(`/api/media/${id}?locale=zh`, { method: 'PATCH', body: { alt: altZh } })
  return id
}

/** 名称归一化：忽略大小写、首尾与内部多余空白 */
export const normalizeName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
