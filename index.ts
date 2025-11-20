import { PluginAPI } from 'tailwindcss/plugin';
import { parseModifier as parseModifierV4 } from './node_modules/tailwindcss4/src/candidate.js';

export function createModifierParser(
  api: PluginAPI,
): (modifier: string | null) => string | null {
  // detect v4+ by checking for the absence of the postcss argument
  const isNewApi = !('postcss' in api);
  return (modifier: string | null): string | null => {
    /* trim the modifier */
    const trimmed = modifier?.trim();
    if (!trimmed) return null;

    if (isNewApi) {
      /**
       * Only enable the following fix if we experience issues where variable shorthand
       * syntax in modifiers is parsed as standard arbitrary values and replaces 
       * and we want to undo that as a stop-gap-solution. This is a known issue.
       */
      // if (trimmed.startsWith('var(')) return trimmed.replace(/ /g, '_');
      return trimmed;
    }

    // v3: disallow v4+ variable shorthand syntax
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      throw new Error(
        `This variable shorthand syntax is only supported in Tailwind CSS v4.0 and above: ${trimmed}. In v3.x, you must use [${trimmed.slice(1, -1)}].`
      );
    }

    // v3: support v3 variable shorthand syntax: `[--name]` -> `var(--name)`
    if (trimmed.startsWith('[--') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1); // '--name'
      return `var(${inner})`;
    }

    // Fallback to the v4-style modifier parser for other v3 cases
    return parseModifierV4(trimmed)?.value ?? null;
  }
}