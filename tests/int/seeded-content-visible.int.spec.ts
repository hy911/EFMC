import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  getCaseStudies,
  getCaseStudyBySlug,
  getFeaturedProducts,
  getIndustries,
  getPosts,
} from '@/lib/queries'
import config from '@/payload.config'

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

/**
 * 公开 REST/GraphQL 不能读到草稿。
 *
 * 真实事故：CaseStudies 开了 drafts，但 collection 的 `read` 还是 `anyone`，
 * 于是 `curl <站点>/api/case-studies` 不带任何登录态就能读到未发布客户案例的全文。
 * 前台页面是干净的（列表/详情/sitemap 都带了 `where: PUBLISHED`），漏的是
 * collection 自身的公开 API 面 —— 两者是**两道独立的闸门**，别只顾一头。
 *
 * `overrideAccess: false` 且不传 user，等价于匿名请求走 access 规则，
 * 这正是公开 REST 的路径。以后任何 collection 开 drafts 都要在这里补一条。
 */
describe('公开 API 不泄露草稿', () => {
  const SLUG = 'zzz-int-draft-leak-probe'
  let payload: Awaited<ReturnType<typeof getPayload>>
  let draftId: number | string | undefined

  // 库里全是已发布内容时，下面的断言会「恰好」通过 —— 那是假绿。
  // 必须自己造一条真草稿，测试才有意义。
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const { docs: media } = await payload.find({ collection: 'media', limit: 1, depth: 0 })
    const created = await payload.create({
      collection: 'case-studies',
      draft: true,
      data: {
        _status: 'draft',
        title: '草稿泄漏探针（测试用）',
        slug: SLUG,
        excerpt: '测试结束会删掉',
        coverImage: media[0]!.id,
      },
      locale: 'en',
    })
    draftId = created.id
  })

  afterAll(async () => {
    if (draftId) await payload.delete({ collection: 'case-studies', id: draftId })
  })

  it('探针草稿确实存在（否则下面的断言是假绿）', async () => {
    const { docs } = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: SLUG } },
      limit: 1,
    })
    expect(docs[0]?._status).toBe('draft')
  })

  it('匿名读 case-studies 只拿得到已发布的', async () => {
    const { docs } = await payload.find({
      collection: 'case-studies',
      overrideAccess: false, // 不给 user = 匿名，走 access 规则
      limit: 200,
      locale: 'en',
    })
    const statuses = [...new Set(docs.map((d) => d._status))]
    expect(statuses, `匿名请求拿到了非 published 的文档：${statuses.join(', ')}`).toEqual([
      'published',
    ])
    expect(docs.some((d) => d.slug === SLUG)).toBe(false)
  })

  it('匿名加 draft=true 也硬要不到草稿', async () => {
    const { docs } = await payload.find({
      collection: 'case-studies',
      overrideAccess: false,
      draft: true, // 攻击者会直接加这个参数
      limit: 200,
      locale: 'en',
    })
    expect(docs.some((d) => d.slug === SLUG)).toBe(false)
  })
})
