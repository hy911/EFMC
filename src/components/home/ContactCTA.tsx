import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'
import { buildWaLink } from '@/lib/whatsapp'
import type { SiteSetting } from '@/payload-types'

import { InquiryForm } from './InquiryForm'

/**
 * 联系 CTA 区（设计稿 1:1）：深蓝底，左侧标题 + WhatsApp 按钮 + 联系方式，
 * 右侧白色询盘表单卡。联系方式全部来自站点设置（后台可改）。
 */
export async function ContactCTA({ settings }: { settings: SiteSetting }) {
  const t = await getTranslations('contact')
  const wa = settings.contact.whatsAppNumber

  const rows = [
    { label: t('emailLabel'), value: settings.contact.email },
    { label: t('phoneLabel'), value: settings.contact.phone },
    { label: t('locationLabel'), value: settings.contact.location },
  ]

  return (
    <section id="contact" className="border-t border-white/8 bg-navy text-white">
      <Container className="grid grid-cols-1 items-start gap-12 py-20 lg:grid-cols-2 lg:gap-[72px] lg:py-[104px]">
        <div data-reveal>
          <h2 className="m-0 mb-5 font-display text-[32px] leading-[1.12] font-bold tracking-[-0.3px] sm:text-[42px]">
            {t('title')}
          </h2>
          <p className="m-0 mb-9 max-w-[460px] text-[17px] leading-[1.7] text-cloud">
            {t('body')}
          </p>

          {/* WhatsApp 按钮（号码未配置时隐藏） */}
          {wa && (
            <a
              href={buildWaLink(wa)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/28 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-whatsapp" aria-hidden="true" />
              {t('whatsapp')}
            </a>
          )}

          {/* 联系方式列表 */}
          <div className="mt-11 flex flex-col gap-2.5 text-[15px] text-cloud">
            {rows.map((row) => (
              <div key={row.label}>
                <span className="mr-3 font-semibold text-sky">{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>
        </div>

        <InquiryForm />
      </Container>
    </section>
  )
}
