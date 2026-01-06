import type { PluginTypewriterOptions, TriggerMode, ParsedLine, ResolvedBlockOptions } from './types'

/**
 * Default configuration values
 */
export const DEFAULT_OPTIONS: Required<PluginTypewriterOptions> = {
  speed: 50,
  prompt: '$',
  trigger: 'visible',
  startDelay: 500,
  lineDelay: 300,
  showReplayButton: true,
  replayButtonText: 'Replay',
  cursorChar: '\u2588', // Full block character █
  outputDelay: 0,
  loop: false,
  loopDelay: 1000,
  typingVariance: 0,
  stepMode: false,
}

/**
 * Valid trigger modes for validation
 */
const VALID_TRIGGERS: TriggerMode[] = ['visible', 'click', 'load']

/**
 * Merges user options with defaults, with validation.
 * Invalid values silently fall back to defaults.
 */
export function resolveOptions(
  options: PluginTypewriterOptions = {}
): Required<PluginTypewriterOptions> {
  return {
    speed:
      typeof options.speed === 'number' && options.speed > 0
        ? options.speed
        : DEFAULT_OPTIONS.speed,
    prompt:
      typeof options.prompt === 'string' && options.prompt.length > 0
        ? options.prompt
        : DEFAULT_OPTIONS.prompt,
    trigger:
      VALID_TRIGGERS.includes(options.trigger as TriggerMode)
        ? (options.trigger as TriggerMode)
        : DEFAULT_OPTIONS.trigger,
    startDelay:
      typeof options.startDelay === 'number' && options.startDelay >= 0
        ? options.startDelay
        : DEFAULT_OPTIONS.startDelay,
    lineDelay:
      typeof options.lineDelay === 'number' && options.lineDelay >= 0
        ? options.lineDelay
        : DEFAULT_OPTIONS.lineDelay,
    showReplayButton: options.showReplayButton ?? DEFAULT_OPTIONS.showReplayButton,
    replayButtonText:
      typeof options.replayButtonText === 'string' && options.replayButtonText.trim()
        ? options.replayButtonText
        : DEFAULT_OPTIONS.replayButtonText,
    cursorChar:
      typeof options.cursorChar === 'string' && options.cursorChar.length > 0
        ? options.cursorChar
        : DEFAULT_OPTIONS.cursorChar,
    outputDelay:
      typeof options.outputDelay === 'number' && options.outputDelay >= 0
        ? options.outputDelay
        : DEFAULT_OPTIONS.outputDelay,
    loop: options.loop ?? DEFAULT_OPTIONS.loop,
    loopDelay:
      typeof options.loopDelay === 'number' && options.loopDelay >= 0
        ? options.loopDelay
        : DEFAULT_OPTIONS.loopDelay,
    typingVariance:
      typeof options.typingVariance === 'number' &&
      options.typingVariance >= 0 &&
      options.typingVariance <= 1
        ? options.typingVariance
        : DEFAULT_OPTIONS.typingVariance,
    stepMode: options.stepMode ?? DEFAULT_OPTIONS.stepMode,
  }
}

/**
 * Parses code block content into structured line data.
 * Lines starting with the prompt (after trimming leading whitespace) are considered input lines.
 */
export function parseLines(code: string, prompt: string): ParsedLine[] {
  const lines = code.split('\n')
  return lines.map((content, index) => {
    const trimmedContent = content.trimStart()
    const isInput = trimmedContent.startsWith(prompt)
    return {
      content,
      isInput,
      charCount: content.length,
      index,
    }
  })
}

/**
 * Interface for Expressive Code's meta options accessor
 */
interface MetaOptionsAccessor {
  getBoolean: (key: string) => boolean | undefined
  getString: (key: string) => string | undefined
}

/**
 * Resolves per-block meta options, merging with global config.
 * Returns null if the block should not be animated (no `typed` option).
 */
export function resolveBlockOptions(
  metaOptions: MetaOptionsAccessor,
  globalConfig: Required<PluginTypewriterOptions>
): ResolvedBlockOptions | null {
  const typed = metaOptions.getBoolean('typed')
  if (!typed) return null

  // Parse speed override
  const speedStr = metaOptions.getString('speed')
  const speedParsed = speedStr ? parseInt(speedStr, 10) : NaN
  const speed = !isNaN(speedParsed) && speedParsed > 0 ? speedParsed : globalConfig.speed

  // Parse prompt override
  const prompt = metaOptions.getString('prompt') ?? globalConfig.prompt

  // Parse trigger override
  const triggerStr = metaOptions.getString('trigger')
  const trigger = VALID_TRIGGERS.includes(triggerStr as TriggerMode)
    ? (triggerStr as TriggerMode)
    : globalConfig.trigger

  // Parse delay override (maps to startDelay)
  const delayStr = metaOptions.getString('delay')
  const delayParsed = delayStr ? parseInt(delayStr, 10) : NaN
  const startDelay = !isNaN(delayParsed) && delayParsed >= 0 ? delayParsed : globalConfig.startDelay

  // Parse lineDelay override
  const lineDelayStr = metaOptions.getString('lineDelay')
  const lineDelayParsed = lineDelayStr ? parseInt(lineDelayStr, 10) : NaN
  const lineDelay = !isNaN(lineDelayParsed) && lineDelayParsed >= 0 ? lineDelayParsed : globalConfig.lineDelay

  // Parse outputDelay override
  const outputDelayStr = metaOptions.getString('outputDelay')
  const outputDelayParsed = outputDelayStr ? parseInt(outputDelayStr, 10) : NaN
  const outputDelay = !isNaN(outputDelayParsed) && outputDelayParsed >= 0 ? outputDelayParsed : globalConfig.outputDelay

  // Parse loop override
  const loop = metaOptions.getBoolean('loop') ?? globalConfig.loop

  // Parse loopDelay override
  const loopDelayStr = metaOptions.getString('loopDelay')
  const loopDelayParsed = loopDelayStr ? parseInt(loopDelayStr, 10) : NaN
  const loopDelay = !isNaN(loopDelayParsed) && loopDelayParsed >= 0 ? loopDelayParsed : globalConfig.loopDelay

  // Parse typingVariance override (meta key: variance)
  const varianceStr = metaOptions.getString('variance')
  const varianceParsed = varianceStr ? parseFloat(varianceStr) : NaN
  const typingVariance = !isNaN(varianceParsed) && varianceParsed >= 0 && varianceParsed <= 1
    ? varianceParsed
    : globalConfig.typingVariance

  // Parse stepMode override
  const stepMode = metaOptions.getBoolean('stepMode') ?? globalConfig.stepMode

  return {
    typed: true,
    speed,
    prompt,
    trigger,
    startDelay,
    lineDelay,
    outputDelay,
    loop,
    loopDelay,
    typingVariance,
    stepMode,
  }
}

/**
 * Generates a unique identifier for a typed block
 */
export function generateBlockId(): string {
  return `ec-typed-${Math.random().toString(36).substring(2, 11)}`
}
