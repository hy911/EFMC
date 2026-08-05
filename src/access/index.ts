import type { Access } from 'payload'

/**
 * 全站复用的访问控制辅助函数。
 * Payload 的 access 返回 true（放行）/ false（拒绝）/ 查询条件（行级过滤）。
 */

/** 任何人可访问（公开内容的 read） */
export const anyone: Access = () => true

/** 仅登录后台的用户（运营/管理员） */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * 任何人都不行 —— 用于 Inquiries 的公开写入口：
 * 表单 API 走服务端 Local API（overrideAccess 默认绕过 access），
 * 因此对外的 REST/GraphQL 可以完全关死，防止垃圾数据与数据泄露。
 */
export const noOne: Access = () => false

/**
 * 开了 versions.drafts 的 collection **必须**用这个当 read，不能用 anyone。
 *
 * 草稿文档在主表里是实实在在存在的一行（`_status: 'draft'`），前台页面靠
 * 查询里的 `where: PUBLISHED` 挡住它 —— 但那只管我们自己写的查询。
 * collection 的 read 如果是 `anyone`，Payload 的**公开 REST/GraphQL**
 * 会把草稿连正文一起吐出来：`curl <站点>/api/case-studies` 不带任何登录态
 * 就能读到未发布的客户案例。这个漏洞真实发生过（2026-08 修）。
 *
 * 登录用户（后台、预览）照常看全部；匿名请求只给已发布的行。
 * 服务端 Local API 默认 overrideAccess，所以 src/lib/queries.ts 不受影响。
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) =>
  user ? true : { _status: { equals: 'published' } }
