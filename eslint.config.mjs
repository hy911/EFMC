// ESLint 9 flat config —— eslint-config-next 16 原生提供 flat 导出，无需 FlatCompat
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/migrations/',
      // 客户端预览的产物：真实渲染器打的包（压缩过）+ 编译好的 Tailwind
      // 由 scripts/build-case-preview.mjs 生成，不手写也不该被规则挑刺
      'scripts/lib/preview/',
      // 图片/案例的加工产物与打给客户的包（已 gitignore），里面会有上面那份
      // 压缩产物的副本 —— 打一次包就冒一千条 warning，没有意义
      'photos-out/',
    ],
  },
]

export default eslintConfig
