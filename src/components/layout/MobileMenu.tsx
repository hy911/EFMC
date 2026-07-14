'use client'

import { useState } from 'react'

type NavItem = { href: string; label: string }

/**
 * 移动端汉堡菜单（<lg 显示）。
 * 首页导航是锚点链接，点击后自动收起。
 */
export function MobileMenu({ items, cta }: { items: NavItem[]; cta: NavItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        {/* 三条线 → 打开时变 X */}
        <span
          className={`h-0.5 w-5 bg-navy transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span className={`h-0.5 w-5 bg-navy transition-opacity ${open ? 'opacity-0' : ''}`} />
        <span
          className={`h-0.5 w-5 bg-navy transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-[72px] flex flex-col border-b border-line bg-white px-6 py-4 shadow-lg">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-3 text-[15px] font-medium text-slate-nav last:border-0"
            >
              {item.label}
            </a>
          ))}
          <a
            href={cta.href}
            onClick={() => setOpen(false)}
            className="mt-3 bg-accent px-5 py-3 text-center text-[14.5px] font-semibold text-white"
          >
            {cta.label}
          </a>
        </nav>
      )}
    </div>
  )
}
