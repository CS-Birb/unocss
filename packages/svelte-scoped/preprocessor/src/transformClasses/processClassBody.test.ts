import type { ResolvedConfig, StringifiedUtil, UnoGenerator } from '@unocss/core'
import type { FoundClass } from './findClasses'
import type { ProcessResult } from './processClasses'
import { processClassBody } from './processClassBody'

const utils: StringifiedUtil<{}>[] = [
  [
    1,
    'mb-1',
    'margin-bottom: 0.25rem',
    undefined,
    undefined,
    undefined,
    undefined,
  ],
  [
    2,
    'mr-1',
    'margin-right: 0.25rem',
    undefined,
    undefined,
    undefined,
    undefined,
  ],
]

const shortcutName = 'my-shortcut'
// @ts-expect-error config not being fully fleshed out
const config: ResolvedConfig = {
  safelist: [],
  shortcuts: [[shortcutName, 'px-1']],
}

// @ts-expect-error generator not being fully fleshed out
const unoMock: UnoGenerator = {
  config,
  parseToken: async (token: string) => {
    const util = utils.find(([, name]) => name === token)
    if (util)
      return [util]
    return undefined
  },
}

describe('processClassBody', () => {
  describe('handles two simples classes and an unknown', () => {
    const foundClass: FoundClass = {
      body: 'mb-1 mr-1 foo',
      start: 13,
      end: 17,
      type: 'regular',
    }

    test('uncombined', async () => {
      const expected: Partial<ProcessResult> = {
        rulesToGenerate: {
          '_mb-1_7dkb0w': ['mb-1'],
          '_mr-1_7dkb0w': ['mr-1'],
        },
        codeUpdate: {
          content: '_mb-1_7dkb0w _mr-1_7dkb0w foo',
          start: 13,
          end: 17,
        },
        shortcuts: [],
      }

      expect(await processClassBody(foundClass, { combine: false }, unoMock, 'Foo.svelte')).toEqual(expected)
    })

    test('combined', async () => {
      const expected: Partial<ProcessResult> = {
        rulesToGenerate: {
          'uno-07jvco': ['mb-1', 'mr-1'],
        },
        codeUpdate: {
          content: 'uno-07jvco foo',
          start: 13,
          end: 17,
        },
        shortcuts: [],
      }

      expect(await processClassBody(foundClass, { combine: true }, unoMock, 'Foo.svelte')).toEqual(expected)
    })

    test('extra spaces and unknown class in middle', async () => {
      const reorderedClass = {
        ...foundClass,
        body: 'mb-1   foo mr-1',
      }
      const result1 = await processClassBody(foundClass, { combine: false }, unoMock, 'Foo.svelte')
      const result2 = await processClassBody(reorderedClass, { combine: false }, unoMock, 'Foo.svelte')
      expect(result1).toEqual(result2)
    })
  })

  test('returns empty object if only finds unknown classes', async () => {
    const classToIgnore: FoundClass = {
      body: 'foo bar',
      start: 0,
      end: 3,
      type: 'regular',
    }
    expect(await processClassBody(classToIgnore, {}, unoMock, 'Foo.svelte')).toEqual({})
  })

  test('shortcut', async () => {
    const shortcut: FoundClass = {
      body: shortcutName,
      start: 0,
      end: 3,
      type: 'regular',
    }
    expect(await processClassBody(shortcut, {}, unoMock, 'Foo.svelte')).toEqual({ shortcuts: [shortcutName] })
  })
})
