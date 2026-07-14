'use client'

import { useEffect } from 'react'

/**
 * 入场动画驱动（对应设计稿的 IntersectionObserver reveal 效果）。
 *
 * 渐进增强策略：
 * 1. 服务端 HTML 里所有 [data-reveal] 默认可见（不加任何隐藏样式）
 * 2. 本组件挂载后给 <html> 加 .reveal-ready，CSS 才切到"初始隐藏"态
 * 3. IntersectionObserver 在元素进入视口 12% 时加 .in 触发上移淡入
 * 无 JS 环境（爬虫、脚本失败）内容始终可见。页面里引入一次即可。
 */
export function RevealInit() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el))
    // 观察就绪后再启用隐藏初始态，避免内容先藏后闪
    document.documentElement.classList.add('reveal-ready')

    return () => {
      io.disconnect()
      document.documentElement.classList.remove('reveal-ready')
    }
  }, [])

  return null
}
