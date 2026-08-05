import { describe, expect, it } from 'vitest'

import {
  getCaseStudies,
  getCaseStudyBySlug,
  getFeaturedProducts,
  getIndustries,
  getPosts,
} from '@/lib/queries'

/**
 * 「seed 之后，前台真的看得见内容吗」
 *
 * 为什么要这组测试：
 * CaseStudies 开草稿那次，seed 建的案例因为没显式写 _status 全落成了草稿，
 * 而同一个提交给前台查询加了 `where: PUBLISHED` —— 案例列表整个空掉。
 * 这个 bug 一路过了 lint / tsc / migrate / seed / build / test:int，
 * 最后靠 e2e 点击超时（30 秒 × 3 次重试）才暴露，CI 连红三次。
 *
 * 下面这些断言 10 秒内就能抓到它。而且这个坑会**复发** —— 以后任何 collection
 * 开 versions.drafts 都会踩一遍同样的默认值。新增开草稿的 collection 时，
 * 记得在这里补一条。
 *
 * 用的是 src/lib/queries.ts 里前台**真正调用**的那些函数，不是自己另写查询，
 * 这样 PUBLISHED 过滤、locale 透传、排序都在覆盖范围内。
 *
 * 前提：库里已经 pnpm seed 过（CI 的顺序就是 migrate → seed → test:int）。
 */
describe('seed 之后前台内容可见', () => {
  it('案例列表非空（草稿过滤没把 seed 的内容全滤掉）', async () => {
    const cases = await getCaseStudies('en')
    expect(cases.length).toBeGreaterThan(0)
  })

  it('每条案例都能按 slug 查到详情', async () => {
    const cases = await getCaseStudies('en')
    for (const c of cases) {
      const detail = await getCaseStudyBySlug('en', c.slug)
      expect(detail, `案例 ${c.slug} 在列表里但详情查不到`).not.toBeNull()
    }
  })

  it('列表里不出现草稿', async () => {
    const cases = await getCaseStudies('en')
    for (const c of cases) {
      expect(c._status, `案例 ${c.slug} 是草稿却出现在公开列表里`).toBe('published')
    }
  })

  it('中文也查得到（locale 透传没断）', async () => {
    const zh = await getCaseStudies('zh')
    expect(zh.length).toBeGreaterThan(0)
  })

  it('首页三块数据源都非空', async () => {
    expect((await getFeaturedProducts('en')).length).toBeGreaterThan(0)
    expect((await getIndustries('en')).length).toBeGreaterThan(0)
  })

  it('博客列表可查（未开草稿，但同样是公开列表）', async () => {
    // 断言「不抛错」而非「非空」：Posts 是二期内容，seed 里可能一篇都没有
    await expect(getPosts('en')).resolves.toBeInstanceOf(Array)
  })
})
