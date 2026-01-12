# Expressive Code Typewriter

Add typewriter-style typing animations to your code blocks.

[![npm version](https://badge.fury.io/js/expressive-code-typewriter.svg)](https://www.npmjs.com/package/expressive-code-typewriter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Terminal-style typing animation with character-by-character reveal
- Blinking cursor that follows the typing position
- Input lines (with prompt) type out, output lines appear instantly
- Multiple trigger modes: `visible`, `click`, or `load`
- Configurable typing speed, delays, and natural variance
- Step-through mode for user-controlled progression
- Loop mode for continuous replay
- Replay button to re-run animations
- Respects `prefers-reduced-motion` for accessibility
- Works with Starlight, Astro, Next.js, and standalone Expressive Code setups

## Installation

Install the plugin using your preferred package manager:

```bash
npm install expressive-code-typewriter
```

## Quick Start

```js
import { pluginTypewriter } from 'expressive-code-typewriter';

// Add to your Expressive Code configuration
plugins: [pluginTypewriter()]
```

Then add `typed` to any code block:

````md
```bash typed
$ npm install my-package
Installing...
Done!
```
````

## Per-Block Options

Customize individual code blocks with meta string options:

````md
```bash typed speed="30" variance="0.3" outputDelay="500"
$ npm run build
Compiling...
Done!
```
````


Available options: `speed`, `prompt`, `trigger`, `delay`, `lineDelay`, `outputDelay`, `loop`, `loopDelay`, `variance`, `stepMode`

## Documentation

For comprehensive documentation, configuration options, and live examples, visit the [plugin documentation](https://frostybee.github.io/expressive-code-typewriter/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

Licensed under the MIT License, Copyright © frostybee.

See [LICENSE](/LICENSE) for more information.

## Links

- [GitHub Repository](https://github.com/frostybee/expressive-code-typewriter)
- [npm Package](https://www.npmjs.com/package/expressive-code-typewriter)
- [Documentation](https://frostybee.github.io/expressive-code-typewriter/)
- [Issues](https://github.com/frostybee/expressive-code-typewriter/issues)
