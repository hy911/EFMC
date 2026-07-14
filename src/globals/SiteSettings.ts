import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'

/**
 * 站点设置（Global）—— 联系方式、WhatsApp 号码等运营可改的全站信息。
 * 首页联系区、页脚、WhatsApp 浮动按钮都从这里取数，避免硬编码。
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { en: 'Site Settings', zh: '站点设置' },
  admin: {
    group: { en: 'System', zh: '系统' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'companyName',
      label: { en: 'Company Name', zh: '公司全称' },
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Tianjin Donglin Zhongkong Automation Technology Co., Ltd.',
    },
    {
      name: 'contact',
      label: { en: 'Contact', zh: '联系方式' },
      type: 'group',
      fields: [
        {
          name: 'email',
          label: { en: 'Sales Email', zh: '销售邮箱' },
          type: 'email',
          required: true,
          defaultValue: 'sales@donglin-controls.com',
        },
        {
          name: 'phone',
          label: { en: 'Phone', zh: '电话' },
          type: 'text',
          required: true,
          defaultValue: '+86 22 0000 0000',
        },
        {
          name: 'location',
          label: { en: 'Location', zh: '地址' },
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Tianjin, China',
        },
        {
          // 纯数字国际格式（含国家码，不带 + 和空格），用于拼 wa.me 深链
          name: 'whatsAppNumber',
          label: { en: 'WhatsApp Number', zh: 'WhatsApp 号码' },
          type: 'text',
          admin: {
            description: {
              en: 'International format, digits only (e.g. 8613800000000). Leave empty to hide WhatsApp buttons.',
              zh: '国际格式纯数字（如 8613800000000）；留空则隐藏全站 WhatsApp 按钮。',
            },
          },
          defaultValue: '8613800000000',
          validate: (value: string | null | undefined) => {
            if (value && !/^\d{6,15}$/.test(value)) {
              return 'Must be 6–15 digits, international format without "+"'
            }
            return true
          },
        },
      ],
    },
  ],
}
