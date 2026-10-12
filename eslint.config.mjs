import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      '.next/',
      'docs/',
      'tmp/',
      'src/migrations/',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
    ],
  },
]

export default eslintConfig
