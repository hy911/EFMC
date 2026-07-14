import type { ReactNode } from 'react'

/** 设计稿的内容容器：max-width 1240px + 左右 32px 内边距 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-(--container-content) px-6 sm:px-8 ${className ?? ''}`}>
      {children}
    </div>
  )
}
