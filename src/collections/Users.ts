import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'

/** 后台用户（运营/管理员）。一期不分角色，登录即有内容管理权限 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { en: 'User', zh: '用户' }, plural: { en: 'Users', zh: '后台用户' } },
  admin: {
    useAsTitle: 'email',
    group: { en: 'System', zh: '系统' },
  },
  auth: true,
  access: {
    // 用户管理仅限已登录用户
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', zh: '姓名' },
      type: 'text',
    },
  ],
}
