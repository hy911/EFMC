'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputClass =
  'border border-input px-3.5 py-[13px] text-[15px] font-sans text-ink outline-accent placeholder:text-steel/70'

/**
 * 询盘表单（设计稿 1:1：白卡，Name/Company 双列 + Email + Message + 提交按钮）。
 * 提交 → POST /api/inquiries（服务端校验 + Turnstile + 写库 + 邮件通知）。
 * sourceProductId：产品页复用本表单时传入，询盘会关联来源产品。
 */
export function InquiryForm({ sourceProductId }: { sourceProductId?: number }) {
  const t = useTranslations('contact.form')
  const locale = useLocale()
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sourceProduct: sourceProductId,
          locale,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <form
      data-reveal
      onSubmit={handleSubmit}
      className="flex flex-col gap-[18px] bg-white p-6 text-ink sm:p-10"
    >
      <div className="font-display text-xl font-bold text-navy">{t('title')}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          name="name"
          required
          maxLength={100}
          placeholder={t('name')}
          className={inputClass}
          aria-label={t('name')}
        />
        <input
          name="company"
          maxLength={200}
          placeholder={t('company')}
          className={inputClass}
          aria-label={t('company')}
        />
      </div>

      <input
        name="email"
        type="email"
        required
        maxLength={200}
        placeholder={t('email')}
        className={inputClass}
        aria-label={t('email')}
      />

      <textarea
        name="message"
        required
        maxLength={5000}
        rows={4}
        placeholder={t('message')}
        className={`${inputClass} resize-y`}
        aria-label={t('message')}
      />

      <button
        type="submit"
        disabled={status === 'submitting' || status === 'success'}
        className="cursor-pointer border-none bg-accent p-[15px] font-sans text-[15.5px] font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-80"
      >
        {status === 'submitting'
          ? t('submitting')
          : status === 'success'
            ? t('success')
            : t('submit')}
      </button>

      {/* 失败提示（成功文案直接展示在按钮上，与设计稿一致） */}
      {status === 'error' && (
        <p role="alert" className="m-0 text-[13.5px] text-red-600">
          {t('error')}
        </p>
      )}
    </form>
  )
}
