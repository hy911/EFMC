import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

/** robots.txt：屏蔽后台与 API，声明 sitemap */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
