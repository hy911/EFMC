import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

/**
 * robots.txt：屏蔽后台与 API，声明 sitemap。
 *
 * `/api/media/file/` 要单独放行 —— 产品图、案例图和视频的真实地址都在那底下，
 * 被 `Disallow: /api/` 一起拦掉的话，图片搜索一张产品图都收录不到。
 * 工控行业客户是先看设备长什么样再问价的，那是实打实的入口。
 * robots.txt 按最长匹配优先，所以放行的这条压得住上面的 Disallow。
 *
 * openapi.json / docs / health 同理：/.well-known/api-catalog 就是指着这三个
 * 地址去的，被 Disallow: /api/ 挡住的话，那份 API 目录等于一张打不开的清单。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/media/file/', '/api/openapi.json', '/api/docs', '/api/health'],
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
