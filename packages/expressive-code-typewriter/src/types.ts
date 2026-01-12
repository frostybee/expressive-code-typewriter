/**
 * Trigger modes for when the animation should start
 */
export type TriggerMode = 'visible' | 'click' | 'load'

/**
 * Plugin configuration options (set globally when registering the plugin)
 */
export interface PluginTypewriterOptions {
  /** Milliseconds per character for typing speed. Default: `50` */
  speed?: number
  /** Character(s) that identify command input lines. Default: `"$"` */
  prompt?: string
  /** When to start animation. Default: `"visible"` */
  trigger?: TriggerMode
  /** Initial delay before animation starts (ms). Default: `500` */
  startDelay?: number
  /** Delay between lines (ms). Default: `300` */
  lineDelay?: number
  /** Whether to show replay button. Default: `true` */
  showReplayButton?: boolean
  /** Text for replay button. Default: `"Replay"` */
  replayButtonText?: string
  /** Whether to show skip button during animation. Default: `false` */
  showSkipButton?: boolean
  /** Cursor character. Default: `"█"` */
  cursorChar?: string
  /** Delay before output lines appear (ms). Default: `0` */
  outputDelay?: number
  /** Enable continuous replay. Default: `false` */
  loop?: boolean
  /** Delay before loop restart (ms). Default: `1000` */
  loopDelay?: number
  /** Random speed variance per character (0-1). 0.3 = ±30%. Default: `0` */
  typingVariance?: number
  /** Enable step-through mode (advance on click/keypress). Default: `false` */
  stepMode?: boolean
}

/**
 * Parsed line information for animation
 */
export interface ParsedLine {
  /** Original line content */
  content: string
  /** Whether this is a command/input line (starts with prompt) */
  isInput: boolean
  /** Character count for animation timing */
  charCount: number
  /** Line index (0-based) */
  index: number
}

/**
 * Resolved block options (merged from meta string and global config)
 */
export interface ResolvedBlockOptions {
  typed: true
  speed: number
  prompt: string
  trigger: TriggerMode
  startDelay: number
  lineDelay: number
  outputDelay: number
  loop: boolean
  loopDelay: number
  typingVariance: number
  stepMode: boolean
  showSkipButton: boolean
}
