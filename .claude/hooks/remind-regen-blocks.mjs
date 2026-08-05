/**
 * PostToolUse 提醒：改了积木块定义就该重新生成 scripts/lib/case-blocks.json。
 *
 * CI 有 `gen-case-blocks.mjs --check` 守着，但那个只在推上去之后才红 ——
 * 忘记生成要等一轮 CI（约 4 分 40 秒）才知道。这里当场说一声。
 *
 * 这**不是错误**，只是待办：退出码 0，提示走 stdout。
 * 绝不要用退出码 2 —— 编辑本身没问题，拦下来只会制造噪音。
 */
import { execFileSync } from 'node:child_process'

const WATCHED = /\/src\/blocks\/case\.ts$/

function readStdin() {
  return new Promise((resolve) => {
    let buf = ''
    const done = setTimeout(() => resolve(buf), 3000)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (buf += c))
    process.stdin.on('end', () => (clearTimeout(done), resolve(buf)))
    process.stdin.on('error', () => (clearTimeout(done), resolve('')))
  })
}

try {
  const raw = await readStdin()
  if (!raw.trim()) process.exit(0)
  const p = String(JSON.parse(raw)?.tool_input?.file_path ?? '').replace(/\\/g, '/')
  if (!WATCHED.test(p)) process.exit(0)

  // 真的过期了才出声；只改了注释就别打扰
  let stale = false
  try {
    execFileSync('pnpm', ['exec', 'tsx', 'scripts/gen-case-blocks.mjs', '--check'], {
      stdio: 'ignore',
      timeout: 60000,
      shell: process.platform === 'win32',
    })
  } catch {
    stale = true
  }

  if (stale) {
    console.log(
      '积木块定义改了，scripts/lib/case-blocks.json 已过期。外部写手和客户的 AI 拿它当字段权威，' +
        'CI 也有 --check 守着。跑一下并把结果一起提交：\n' +
        '  pnpm exec tsx scripts/gen-case-blocks.mjs',
    )
  }
} catch {
  // 提醒脚本自己坏掉不该影响任何事
}
process.exit(0)
