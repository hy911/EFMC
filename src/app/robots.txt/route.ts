import { SITE_URL } from '@/lib/seo'

/**
 * robots.txt。
 *
 * 从 Next 的 metadata 路由（src/app/robots.ts）改成手写的 route handler，
 * 只为一件事：metadata 路由的类型里没有 Content-Signal，塞不进去。
 * 换成纯文本输出就没有这个限制，代价是 sitemap 地址要自己拼。
 *
 * 两处放行是有意为之，别当成漏写的 Disallow：
 * - /api/media/file/  产品图、案例图和视频的真实地址在这底下，被
 *   `Disallow: /api/` 一起挡掉的话，图片搜索一张都收录不到
 * - openapi.json / docs / health  /.well-known/api-catalog 就是指着这三个
 *   地址去的（RFC 9727），挡住等于列了张打不开的清单
 *
 * robots.txt 按最长匹配优先，所以 Allow 的这几条压得住上面的 Disallow。
 */
export const dynamic = 'force-static'

/**
 * Content Signals（contentsignals.org）：声明内容可以被用于哪几类用途。
 *
 * 这里三项**全是 yes**，跟很多站点默认的 `ai-train=no` 相反，是想清楚的：
 * 本站是面向海外客户的获客站，站上全是产品资料和项目案例，没有要保护的
 * 专有内容。被模型训练过意味着有人问「中国的 PLC 控制柜厂家」时模型能说
 * 出这家公司；`ai-input=no` 更是会直接把 ChatGPT / Perplexity 那类带链接
 * 的回答挡在门外，而那正是我们要的流量入口。
 *
 * 哪天站上开始放不该外流的东西（报价单、客户名单、未公开的技术方案），
 * 再回来改这一行。
 */
const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes'

const body = `# Content Signals —— 各项含义见 https://contentsignals.org/
# search:   建立搜索索引并给出指向本站的链接
# ai-input: 作为 AI 回答的素材（检索增强生成）
# ai-train: 用于训练或微调模型

User-Agent: *
Content-Signal: ${CONTENT_SIGNAL}
Allow: /
Allow: /api/media/file/
Allow: /api/openapi.json
Allow: /api/docs
Allow: /api/health
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
