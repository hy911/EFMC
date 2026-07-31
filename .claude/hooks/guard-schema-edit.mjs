/**
 * PreToolUse 守卫：拦两类已经出过事的编辑。
 *
 * 1. dev server 还在跑的时候改 Payload schema
 *    热重载会抢先把新 schema push 进库，随后 `pnpm payload migrate` 撞
 *    `relation … already exists` / `type … already exists`，整条迁移在一个
 *    事务里失败，得手工写 tsx 脚本 DROP 回滚。这坑本项目连踩三次
 *    （case_studies_highlights 表、章节 intro 列、enum_..._case_cards_layout 枚举）。
 *
 * 2. 手改 src/payload-types.ts
 *    生成物，改完 collection 应该跑 `pnpm generate:types`。手改除了会被下次
 *    生成覆盖，还会让 git stash / rebase 卡在这个大文件上。
 *
 * 约定：退出码 2 = 拦截，stderr 回传给 Claude 当反馈；退出码 0 = 放行。
 * 任何内部异常一律放行（fail-open）—— 守卫脚本自己坏掉不该把所有编辑都堵死。
 */
import net from 'node:net'

/** dev server 端口，与 .claude/launch.json 保持一致 */
const DEV_PORT = 3000

/** 改动会触发 Drizzle schema push 的文件 */
const SCHEMA_FILES = /\/src\/(collections|blocks|fields)\/|\/src\/payload\.config\.ts$/

/** 生成物，只能由 pnpm generate:types 写 */
const GENERATED = /\/src\/payload-types\.ts$/

function readStdin() {
  return new Promise((resolve) => {
    let buf = ''
    // 没有 stdin（手工执行、探活）时别永久挂住
    const done = setTimeout(() => resolve(buf), 3000)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (buf += c))
    process.stdin.on('end', () => (clearTimeout(done), resolve(buf)))
    process.stdin.on('error', () => (clearTimeout(done), resolve('')))
  })
}

/** 端口上有没有东西在听 */
function portBusy(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' })
    const finish = (v) => {
      sock.destroy()
      resolve(v)
    }
    sock.on('connect', () => finish(true))
    sock.on('error', () => finish(false))
    setTimeout(() => finish(false), 1500)
  })
}

function block(msg) {
  console.error(msg)
  process.exit(2)
}

try {
  const raw = await readStdin()
  if (!raw.trim()) process.exit(0)

  const input = JSON.parse(raw)
  const filePath = String(input?.tool_input?.file_path ?? '')
  if (!filePath) process.exit(0)

  // 统一成正斜杠，Windows 上传进来的是反斜杠
  const p = filePath.replace(/\\/g, '/')

  if (GENERATED.test(p)) {
    block(
      'src/payload-types.ts 是生成物，不要手改。\n' +
        '改完 collection / block 定义后跑：pnpm generate:types',
    )
  }

  if (!SCHEMA_FILES.test(p)) process.exit(0)

  if (await portBusy(DEV_PORT)) {
    block(
      `${DEV_PORT} 端口有服务在跑（多半是 pnpm dev）。\n` +
        '改 Payload schema 前必须先停掉它：dev 模式的 Drizzle 会热重载并抢先把新 schema\n' +
        'push 进库，之后 pnpm payload migrate 会撞 "relation/type already exists" 整条失败。\n' +
        '停掉 dev server 后重试。若 3000 上跑的是别的东西，说一声我继续。\n' +
        '（详见 CLAUDE.md「改 collection / block 定义之前先停掉 dev server」）',
    )
  }

  process.exit(0)
} catch {
  // 守卫自己出错就放行，不拦正常工作
  process.exit(0)
}
