import { expect, test } from '@playwright/test'

/**
 * 前台冒烟测试（需要已 seed 的数据库：pnpm seed）。
 * playwright.config 的 webServer 会自动起 pnpm dev / 复用已运行实例。
 */

test.describe('Frontend', () => {
  test('根路径重定向到默认语言 /en', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL(/\/en$/)
  })

  test('英文首页渲染设计稿区块', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(page).toHaveTitle(/Donglin Controls/)
    await expect(page.locator('h1').first()).toHaveText(
      'Complete industrial automation, engineered to specification.',
    )
    // 数据驱动的区块：精选产品 + 信任区
    await expect(page.locator('#products h3').first()).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Authorized. Experienced. Accountable.' }),
    ).toBeVisible()
  })

  test('中文首页文案正确', async ({ page }) => {
    await page.goto('http://localhost:3000/zh')
    await expect(page.locator('h1').first()).toHaveText('成套工业自动化系统，按需定制交付。')
  })

  test('hreflang 串联输出', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    const alternates = page.locator('link[rel="alternate"][hreflang]')
    await expect(alternates).toHaveCount(3) // en / zh / x-default
  })

  test('产品列表页按分类分组并可进入详情页', async ({ page }) => {
    await page.goto('http://localhost:3000/en/products')
    await expect(page.locator('h1')).toHaveText('Products')
    await page.locator('main a[href^="/en/products/"]').first().click()
    await expect(page).toHaveURL(/\/en\/products\/[a-z-]+$/)
    // 产品页含 Product JSON-LD
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(jsonLd).toContain('"@type":"Product"')
  })

  test('询盘表单提交成功', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    const form = page.locator('#contact form')
    await form.getByLabel('Name', { exact: true }).fill('E2E Tester')
    await form.getByLabel('Work email').fill('e2e@example.com')
    await form.getByLabel(/Describe your project/).fill('Playwright end-to-end inquiry.')
    await form.getByRole('button', { name: 'Send Inquiry' }).click()
    await expect(form.getByRole('button')).toHaveText(/we'll reply within 1 business day/)
  })

  test('案例列表可进入详情页并含成果指标', async ({ page }) => {
    await page.goto('http://localhost:3000/en/cases')
    await expect(page.locator('h1')).toHaveText('Case Studies')
    await page.locator('main a[href^="/en/cases/"]').first().click()
    await expect(page).toHaveURL(/\/en\/cases\/[a-z-]+$/)
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(jsonLd).toContain('"@type":"Article"')
  })

  test('博客列表可进入文章页', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/blog')
    await expect(page.locator('h1')).toHaveText('技术博客')
    await page.locator('main a[href^="/zh/blog/"]').first().click()
    await expect(page).toHaveURL(/\/zh\/blog\/[a-z-]+$/)
    await expect(page.locator('main .prose p').first()).toBeVisible()
  })

  test('未知路径返回本地化 404', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/en/no-such-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('About 页渲染多栏要点与 logo 横条', async ({ page }) => {
    await page.goto('http://localhost:3000/en/about')
    await expect(page.getByRole('heading', { name: 'What we deliver' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Industrial-grade electrical control equipment' }),
    ).toBeVisible()
    await expect(page.getByTitle('Siemens')).toBeVisible()
  })

  test('About 页中文语种显示中文文案', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/about')
    await expect(page.getByRole('heading', { name: '我们交付什么' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '工业级电气控制设备' })).toBeVisible()
  })

  test('首页优势区渲染四栏与技术要点', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(
      page.getByRole('heading', { name: 'Why customers specify Donglin' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Software-Hardware Synergy' })).toBeVisible()
    await expect(page.getByText(/MIL-STD-883G/)).toBeVisible()
    await expect(page.getByText(/160\+ patents/)).toBeVisible()
  })

  test('首页优势区中文语种：标题译中文、技术术语保留原文', async ({ page }) => {
    await page.goto('http://localhost:3000/zh')
    await expect(page.getByRole('heading', { name: '软硬件协同' })).toBeVisible()
    await expect(page.getByText(/MIL-STD-883G/)).toBeVisible()
  })

  test('首页优势区在 375px 视口堆成单栏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:3000/en')
    const first = page.locator('#advantage h3').first()
    const second = page.locator('#advantage h3').nth(1)
    const firstBox = await first.boundingBox()
    const secondBox = await second.boundingBox()
    // 单栏：第二栏标题必须在第一栏下方，而非并排
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height)
  })
})
