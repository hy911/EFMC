/**
 * 站点对外开放的接口清单 —— API 目录、OpenAPI 规范、人读文档三处共用一份。
 *
 * 只列**公开可访问**的东西。判断依据是 collection 的 read access：
 * Users 是 authenticated、Inquiries 对公开 REST 完全关死（写入只走
 * /api/inquiries 这一个 route handler），所以两者都不在这里。
 * CaseStudies 用 publishedOrAuthenticated，匿名请求只拿得到已发布版。
 *
 * 加/减公开 collection 时改这里，三处一起生效。
 */

/** 匿名可读的内容 collection（与各自 collection 的 read access 对应） */
export const PUBLIC_COLLECTIONS = [
  'products',
  'product-categories',
  'case-studies',
  'application-scenarios',
  'certificates',
  'posts',
  'pages',
  'media',
] as const

export const PUBLIC_APIS = [
  {
    anchor: '/api/inquiries',
    title: 'Inquiry API',
    summary: '提交询盘（站点唯一写入入口，带人机校验）',
  },
  {
    anchor: '/api',
    title: 'Content API',
    summary: '只读的产品、案例、行业与文章内容',
  },
  {
    anchor: '/mcp',
    title: 'MCP Server',
    summary: 'Model Context Protocol 端点（Streamable HTTP，只读工具）',
  },
] as const
