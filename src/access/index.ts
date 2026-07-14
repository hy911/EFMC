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
