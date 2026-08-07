import { PUBLIC_COLLECTIONS } from '@/lib/api-catalog'
import { SITE_URL } from '@/lib/seo'

/**
 * 人读的接口说明 —— API 目录（RFC 9727）的 service-doc 指向这里。
 *
 * 刻意不做成前台页面：这份是给对接方和代理看的技术说明，不该进
 * 导航、不该进 sitemap、也不需要中英两版（对接语言是英文加代码）。
 * 一个独立的静态 HTML 路由最省事，也不会被 next-intl 的语言前缀绕进去。
 */
export const dynamic = 'force-static'

const rows = PUBLIC_COLLECTIONS.map((c) => `<code>/api/${c}</code>`).join('、')

const html = `<!doctype html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>Public API · Donglin Controls</title>
<style>
  :root{color-scheme:light dark}
  body{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem;
    font:16px/1.65 ui-sans-serif,system-ui,sans-serif}
  h1{font-size:1.6rem;margin:0 0 .25rem}
  h2{font-size:1.1rem;margin:2.25rem 0 .5rem}
  code{background:color-mix(in srgb,currentColor 8%,transparent);padding:.1em .35em}
  pre{background:color-mix(in srgb,currentColor 6%,transparent);padding:1rem;overflow-x:auto}
  .lede{opacity:.75;margin-top:0}
  table{border-collapse:collapse;width:100%}
  td,th{text-align:left;padding:.4rem .6rem;border-bottom:1px solid color-mix(in srgb,currentColor 15%,transparent)}
</style>
<body>
<h1>Public API</h1>
<p class="lede">Donglin Controls (天津东林众控). Product showcase and sales-inquiry site —
there is no ordering or payment API.</p>

<table>
  <tr><th>Catalog</th><td><a href="/.well-known/api-catalog">/.well-known/api-catalog</a> (RFC 9727)</td></tr>
  <tr><th>OpenAPI</th><td><a href="/api/openapi.json">/api/openapi.json</a></td></tr>
  <tr><th>Status</th><td><a href="/api/health">/api/health</a></td></tr>
</table>

<h2>Content API — anonymous, read-only</h2>
<p>Payload CMS REST. Public collections: ${rows}.
Write operations require a CMS account and are not open to public clients.
Unpublished drafts are never returned to anonymous requests.</p>
<pre>curl '${SITE_URL}/api/products?locale=en&amp;limit=5&amp;depth=0'</pre>
<p>Query parameters: <code>locale</code> (<code>en</code> | <code>zh</code>),
<code>limit</code>, <code>page</code>, <code>depth</code>,
and Payload's <code>where[field][operator]=value</code> filters.</p>

<h2>Inquiry API — the only write endpoint</h2>
<p><code>POST /api/inquiries</code> with a JSON body. Protected by a honeypot field and
Cloudflare Turnstile; requests without a valid token are rejected with <code>403</code>.
Rate limiting is enforced at the CDN edge.</p>
<pre>curl -X POST '${SITE_URL}/api/inquiries' \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Please quote a PLC cabinet.","turnstileToken":"..."}'</pre>
<p>Responses: <code>201</code> accepted · <code>422</code> field validation failed
(<code>details</code> lists each field) · <code>403</code> human verification failed ·
<code>400</code> malformed JSON. Field constraints are in the
<a href="/api/openapi.json">OpenAPI document</a>, which is generated from the
server-side validation rules.</p>

<h2>Contact</h2>
<p>Commercial enquiries: <a href="${SITE_URL}/en/contact">${SITE_URL}/en/contact</a></p>
</body></html>`

export function GET() {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
