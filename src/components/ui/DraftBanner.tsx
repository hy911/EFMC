/**
 * 草稿预览横幅。
 *
 * 没有这条的话，预览链接看起来和正式页面一模一样 —— 客户会以为内容已经
 * 上线了，或者把预览链接当正式链接转发出去。所以做成固定在顶部、挡不住
 * 也关不掉，只能点「退出」。
 */
export function DraftBanner({ locale, path }: { locale: string; path: string }) {
  const zh = locale === 'zh'
  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-flag px-4 py-2 text-center text-[13px] font-semibold text-white">
      <span>
        {zh
          ? '草稿预览 —— 这一版还没有发布，公开访问看不到'
          : 'Draft preview — this version is not published yet'}
      </span>
      <a
        className="underline underline-offset-2 hover:no-underline"
        href={`/api/preview/exit?path=${encodeURIComponent(path)}`}
      >
        {zh ? '退出预览' : 'Exit preview'}
      </a>
    </div>
  )
}
