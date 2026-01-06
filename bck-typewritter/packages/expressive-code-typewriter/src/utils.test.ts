import { describe, it, expect } from 'vitest'
import {
  DEFAULT_OPTIONS,
  resolveOptions,
  parseLines,
  resolveBlockOptions,
  generateBlockId,
} from './utils'

describe('DEFAULT_OPTIONS', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_OPTIONS.speed).toBe(50)
    expect(DEFAULT_OPTIONS.prompt).toBe('$')
    expect(DEFAULT_OPTIONS.trigger).toBe('visible')
    expect(DEFAULT_OPTIONS.startDelay).toBe(500)
    expect(DEFAULT_OPTIONS.lineDelay).toBe(300)
    expect(DEFAULT_OPTIONS.showReplayButton).toBe(true)
    expect(DEFAULT_OPTIONS.replayButtonText).toBe('Replay')
    expect(DEFAULT_OPTIONS.cursorChar).toBe('\u2588')
  })
})

describe('resolveOptions', () => {
  describe('default values', () => {
    it('should return all defaults when no options provided', () => {
      const config = resolveOptions()
      expect(config).toEqual(DEFAULT_OPTIONS)
    })

    it('should return all defaults when empty object provided', () => {
      const config = resolveOptions({})
      expect(config).toEqual(DEFAULT_OPTIONS)
    })
  })

  describe('user overrides', () => {
    it('should override speed when provided', () => {
      const config = resolveOptions({ speed: 100 })
      expect(config.speed).toBe(100)
    })

    it('should override prompt when provided', () => {
      const config = resolveOptions({ prompt: '>' })
      expect(config.prompt).toBe('>')
    })

    it('should override trigger when provided', () => {
      const config = resolveOptions({ trigger: 'click' })
      expect(config.trigger).toBe('click')
    })

    it('should accept trigger "load"', () => {
      const config = resolveOptions({ trigger: 'load' })
      expect(config.trigger).toBe('load')
    })

    it('should override startDelay when provided', () => {
      const config = resolveOptions({ startDelay: 1000 })
      expect(config.startDelay).toBe(1000)
    })

    it('should allow zero startDelay', () => {
      const config = resolveOptions({ startDelay: 0 })
      expect(config.startDelay).toBe(0)
    })

    it('should override lineDelay when provided', () => {
      const config = resolveOptions({ lineDelay: 500 })
      expect(config.lineDelay).toBe(500)
    })

    it('should allow zero lineDelay', () => {
      const config = resolveOptions({ lineDelay: 0 })
      expect(config.lineDelay).toBe(0)
    })

    it('should override showReplayButton when provided', () => {
      const config = resolveOptions({ showReplayButton: false })
      expect(config.showReplayButton).toBe(false)
    })

    it('should override replayButtonText when provided', () => {
      const config = resolveOptions({ replayButtonText: 'Run again' })
      expect(config.replayButtonText).toBe('Run again')
    })

    it('should override cursorChar when provided', () => {
      const config = resolveOptions({ cursorChar: '|' })
      expect(config.cursorChar).toBe('|')
    })

    it('should override multiple options', () => {
      const config = resolveOptions({
        speed: 25,
        prompt: '#',
        trigger: 'load',
        startDelay: 200,
      })
      expect(config.speed).toBe(25)
      expect(config.prompt).toBe('#')
      expect(config.trigger).toBe('load')
      expect(config.startDelay).toBe(200)
    })
  })

  describe('validation - invalid values fall back to defaults', () => {
    it('should fall back when speed is zero', () => {
      const config = resolveOptions({ speed: 0 })
      expect(config.speed).toBe(DEFAULT_OPTIONS.speed)
    })

    it('should fall back when speed is negative', () => {
      const config = resolveOptions({ speed: -10 })
      expect(config.speed).toBe(DEFAULT_OPTIONS.speed)
    })

    it('should fall back when prompt is empty', () => {
      const config = resolveOptions({ prompt: '' })
      expect(config.prompt).toBe(DEFAULT_OPTIONS.prompt)
    })

    it('should fall back when trigger is invalid', () => {
      // @ts-expect-error testing invalid input
      const config = resolveOptions({ trigger: 'invalid' })
      expect(config.trigger).toBe(DEFAULT_OPTIONS.trigger)
    })

    it('should fall back when startDelay is negative', () => {
      const config = resolveOptions({ startDelay: -100 })
      expect(config.startDelay).toBe(DEFAULT_OPTIONS.startDelay)
    })

    it('should fall back when lineDelay is negative', () => {
      const config = resolveOptions({ lineDelay: -50 })
      expect(config.lineDelay).toBe(DEFAULT_OPTIONS.lineDelay)
    })

    it('should fall back when replayButtonText is empty', () => {
      const config = resolveOptions({ replayButtonText: '' })
      expect(config.replayButtonText).toBe(DEFAULT_OPTIONS.replayButtonText)
    })

    it('should fall back when replayButtonText is whitespace only', () => {
      const config = resolveOptions({ replayButtonText: '   ' })
      expect(config.replayButtonText).toBe(DEFAULT_OPTIONS.replayButtonText)
    })

    it('should fall back when cursorChar is empty', () => {
      const config = resolveOptions({ cursorChar: '' })
      expect(config.cursorChar).toBe(DEFAULT_OPTIONS.cursorChar)
    })

    it('should fall back when outputDelay is negative', () => {
      const config = resolveOptions({ outputDelay: -100 })
      expect(config.outputDelay).toBe(DEFAULT_OPTIONS.outputDelay)
    })

    it('should fall back when loopDelay is negative', () => {
      const config = resolveOptions({ loopDelay: -100 })
      expect(config.loopDelay).toBe(DEFAULT_OPTIONS.loopDelay)
    })

    it('should fall back when typingVariance is negative', () => {
      const config = resolveOptions({ typingVariance: -0.1 })
      expect(config.typingVariance).toBe(DEFAULT_OPTIONS.typingVariance)
    })

    it('should fall back when typingVariance is greater than 1', () => {
      const config = resolveOptions({ typingVariance: 1.5 })
      expect(config.typingVariance).toBe(DEFAULT_OPTIONS.typingVariance)
    })
  })

  describe('new feature options', () => {
    it('should default outputDelay to 0', () => {
      expect(resolveOptions().outputDelay).toBe(0)
    })

    it('should accept valid outputDelay values', () => {
      expect(resolveOptions({ outputDelay: 500 }).outputDelay).toBe(500)
      expect(resolveOptions({ outputDelay: 0 }).outputDelay).toBe(0)
    })

    it('should default loop to false', () => {
      expect(resolveOptions().loop).toBe(false)
    })

    it('should accept loop: true', () => {
      expect(resolveOptions({ loop: true }).loop).toBe(true)
    })

    it('should default loopDelay to 1000', () => {
      expect(resolveOptions().loopDelay).toBe(1000)
    })

    it('should accept valid loopDelay values', () => {
      expect(resolveOptions({ loopDelay: 2000 }).loopDelay).toBe(2000)
      expect(resolveOptions({ loopDelay: 0 }).loopDelay).toBe(0)
    })

    it('should default typingVariance to 0', () => {
      expect(resolveOptions().typingVariance).toBe(0)
    })

    it('should accept valid typingVariance values', () => {
      expect(resolveOptions({ typingVariance: 0.3 }).typingVariance).toBe(0.3)
      expect(resolveOptions({ typingVariance: 0 }).typingVariance).toBe(0)
      expect(resolveOptions({ typingVariance: 1 }).typingVariance).toBe(1)
    })

    it('should default stepMode to false', () => {
      expect(resolveOptions().stepMode).toBe(false)
    })

    it('should accept stepMode: true', () => {
      expect(resolveOptions({ stepMode: true }).stepMode).toBe(true)
    })
  })
})

describe('parseLines', () => {
  describe('basic parsing', () => {
    it('should parse single input line', () => {
      const lines = parseLines('$ npm install', '$')
      expect(lines).toHaveLength(1)
      expect(lines[0].isInput).toBe(true)
      expect(lines[0].content).toBe('$ npm install')
      expect(lines[0].charCount).toBe(13)
      expect(lines[0].index).toBe(0)
    })

    it('should parse single output line', () => {
      const lines = parseLines('Installing...', '$')
      expect(lines).toHaveLength(1)
      expect(lines[0].isInput).toBe(false)
      expect(lines[0].content).toBe('Installing...')
    })

    it('should parse mixed input and output', () => {
      const code = `$ npm install
Installing dependencies...
Done!`
      const lines = parseLines(code, '$')
      expect(lines).toHaveLength(3)
      expect(lines[0].isInput).toBe(true)
      expect(lines[0].content).toBe('$ npm install')
      expect(lines[1].isInput).toBe(false)
      expect(lines[1].content).toBe('Installing dependencies...')
      expect(lines[2].isInput).toBe(false)
      expect(lines[2].content).toBe('Done!')
    })

    it('should handle multiple input lines', () => {
      const code = `$ cd project
$ npm start`
      const lines = parseLines(code, '$')
      expect(lines).toHaveLength(2)
      expect(lines[0].isInput).toBe(true)
      expect(lines[1].isInput).toBe(true)
    })

    it('should handle different prompt characters', () => {
      const lines = parseLines('> echo hello', '>')
      expect(lines[0].isInput).toBe(true)
    })

    it('should handle multi-character prompts', () => {
      const lines = parseLines('PS> Get-Process', 'PS>')
      expect(lines[0].isInput).toBe(true)
    })

    it('should handle Python prompt', () => {
      const code = `>>> print("hello")
hello`
      const lines = parseLines(code, '>>>')
      expect(lines[0].isInput).toBe(true)
      expect(lines[1].isInput).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const lines = parseLines('', '$')
      expect(lines).toHaveLength(1)
      expect(lines[0].content).toBe('')
      expect(lines[0].charCount).toBe(0)
      expect(lines[0].isInput).toBe(false)
    })

    it('should handle indented prompt', () => {
      const lines = parseLines('  $ npm install', '$')
      expect(lines[0].isInput).toBe(true)
    })

    it('should handle line with only prompt', () => {
      const lines = parseLines('$', '$')
      expect(lines[0].isInput).toBe(true)
      expect(lines[0].charCount).toBe(1)
    })

    it('should handle prompt followed by space', () => {
      const lines = parseLines('$ ', '$')
      expect(lines[0].isInput).toBe(true)
      expect(lines[0].charCount).toBe(2)
    })

    it('should not match prompt in middle of line', () => {
      const lines = parseLines('echo $HOME', '$')
      expect(lines[0].isInput).toBe(false)
    })

    it('should preserve line indices', () => {
      const code = `$ first
output
$ second`
      const lines = parseLines(code, '$')
      expect(lines[0].index).toBe(0)
      expect(lines[1].index).toBe(1)
      expect(lines[2].index).toBe(2)
    })

    it('should handle Windows-style line endings', () => {
      const code = '$ first\r\noutput'
      const lines = parseLines(code, '$')
      // Note: split('\n') will leave \r at end of first line
      expect(lines).toHaveLength(2)
      expect(lines[0].isInput).toBe(true)
    })
  })
})

describe('resolveBlockOptions', () => {
  const mockGlobalConfig = {
    speed: 50,
    prompt: '$',
    trigger: 'visible' as const,
    startDelay: 500,
    lineDelay: 300,
    showReplayButton: true,
    replayButtonText: 'Replay',
    cursorChar: '\u2588',
    outputDelay: 0,
    loop: false,
    loopDelay: 1000,
    typingVariance: 0,
    stepMode: false,
  }

  const createMockMeta = (
    booleans: Record<string, boolean | undefined> = {},
    strings: Record<string, string | undefined> = {}
  ) => ({
    getBoolean: (key: string) => booleans[key],
    getString: (key: string) => strings[key],
  })

  it('should return null when typed is not set', () => {
    const meta = createMockMeta()
    expect(resolveBlockOptions(meta, mockGlobalConfig)).toBeNull()
  })

  it('should return null when typed is false', () => {
    const meta = createMockMeta({ typed: false })
    expect(resolveBlockOptions(meta, mockGlobalConfig)).toBeNull()
  })

  it('should return options when typed is true', () => {
    const meta = createMockMeta({ typed: true })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result).not.toBeNull()
    expect(result!.typed).toBe(true)
    expect(result!.speed).toBe(50)
    expect(result!.prompt).toBe('$')
    expect(result!.trigger).toBe('visible')
  })

  it('should override speed from meta', () => {
    const meta = createMockMeta({ typed: true }, { speed: '100' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.speed).toBe(100)
  })

  it('should fall back to global speed for invalid meta speed', () => {
    const meta = createMockMeta({ typed: true }, { speed: 'abc' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.speed).toBe(50)
  })

  it('should fall back to global speed for zero meta speed', () => {
    const meta = createMockMeta({ typed: true }, { speed: '0' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.speed).toBe(50)
  })

  it('should override prompt from meta', () => {
    const meta = createMockMeta({ typed: true }, { prompt: '>' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.prompt).toBe('>')
  })

  it('should override trigger from meta', () => {
    const meta = createMockMeta({ typed: true }, { trigger: 'click' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.trigger).toBe('click')
  })

  it('should accept load trigger from meta', () => {
    const meta = createMockMeta({ typed: true }, { trigger: 'load' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.trigger).toBe('load')
  })

  it('should fall back to global trigger for invalid meta trigger', () => {
    const meta = createMockMeta({ typed: true }, { trigger: 'invalid' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.trigger).toBe('visible')
  })

  it('should override startDelay from delay meta', () => {
    const meta = createMockMeta({ typed: true }, { delay: '1000' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.startDelay).toBe(1000)
  })

  it('should allow zero delay', () => {
    const meta = createMockMeta({ typed: true }, { delay: '0' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.startDelay).toBe(0)
  })

  it('should override lineDelay from meta', () => {
    const meta = createMockMeta({ typed: true }, { lineDelay: '500' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.lineDelay).toBe(500)
  })

  it('should handle multiple meta overrides', () => {
    const meta = createMockMeta(
      { typed: true },
      { speed: '25', prompt: '#', trigger: 'click', delay: '200' }
    )
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.speed).toBe(25)
    expect(result!.prompt).toBe('#')
    expect(result!.trigger).toBe('click')
    expect(result!.startDelay).toBe(200)
  })

  // New feature meta options tests
  it('should override outputDelay from meta', () => {
    const meta = createMockMeta({ typed: true }, { outputDelay: '500' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.outputDelay).toBe(500)
  })

  it('should fall back for invalid outputDelay', () => {
    const meta = createMockMeta({ typed: true }, { outputDelay: 'abc' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.outputDelay).toBe(0)
  })

  it('should override loop from meta', () => {
    const meta = createMockMeta({ typed: true, loop: true })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.loop).toBe(true)
  })

  it('should override loopDelay from meta', () => {
    const meta = createMockMeta({ typed: true }, { loopDelay: '2000' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.loopDelay).toBe(2000)
  })

  it('should override typingVariance from meta (variance key)', () => {
    const meta = createMockMeta({ typed: true }, { variance: '0.3' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.typingVariance).toBe(0.3)
  })

  it('should fall back for out-of-range variance', () => {
    const meta = createMockMeta({ typed: true }, { variance: '2.0' })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.typingVariance).toBe(0)
  })

  it('should override stepMode from meta', () => {
    const meta = createMockMeta({ typed: true, stepMode: true })
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.stepMode).toBe(true)
  })

  it('should handle all new options together', () => {
    const meta = createMockMeta(
      { typed: true, loop: true, stepMode: true },
      { outputDelay: '300', loopDelay: '1500', variance: '0.5' }
    )
    const result = resolveBlockOptions(meta, mockGlobalConfig)
    expect(result!.outputDelay).toBe(300)
    expect(result!.loop).toBe(true)
    expect(result!.loopDelay).toBe(1500)
    expect(result!.typingVariance).toBe(0.5)
    expect(result!.stepMode).toBe(true)
  })
})

describe('generateBlockId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateBlockId()
    const id2 = generateBlockId()
    expect(id1).not.toBe(id2)
  })

  it('should start with ec-typed-', () => {
    const id = generateBlockId()
    expect(id.startsWith('ec-typed-')).toBe(true)
  })

  it('should have correct format', () => {
    const id = generateBlockId()
    expect(id).toMatch(/^ec-typed-[a-z0-9]+$/)
  })

  it('should generate IDs of consistent length', () => {
    const ids = Array.from({ length: 10 }, () => generateBlockId())
    const lengths = ids.map((id) => id.length)
    // All IDs should be same length (ec-typed- is 9 chars + 9 random chars = 18)
    expect(new Set(lengths).size).toBe(1)
  })
})
