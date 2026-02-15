import { Token, marked } from 'marked';

interface MathInlineToken {
  type: 'mathInline';
  text: string;
  raw: string;
}

// Safari <16.4 doesn't support lookbehind assertions (?<!\s), so we use a simpler
// regex and validate trailing whitespace in the tokenizer instead
const inlineMathRegex = /^\$(?!\s)(.+?)\$(?!\d)/;

export const mathInlineExtension = {
  name: 'mathInline',
  level: 'inline',
  start(src: string) {
    let index: number;
    let indexSrc = src;

    while (indexSrc) {
      index = indexSrc.indexOf('$');
      if (index === -1) {
        return;
      }
      const f = index === 0 || indexSrc.charAt(index - 1) === ' ';
      if (f) {
        const possibleKatex = indexSrc.substring(index);
        if (possibleKatex.match(inlineMathRegex)) {
          return index;
        }
      }

      indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
    }
  },
  tokenizer(src: string): MathInlineToken | undefined {
    const match = inlineMathRegex.exec(src);

    // Reject if content ends with whitespace (replaces lookbehind assertion for Safari <16.4 compatibility)
    if (match && match[1] && !/\s$/.test(match[1])) {
      return {
        type: 'mathInline',
        raw: match[0],
        text: match[1].trim(),
      };
    }
  },
  renderer(token: Token) {
    const mathInlineToken = token as MathInlineToken;
    // parse to prevent escaping slashes
    const latex = marked
      .parse(mathInlineToken.text)
      .toString()
      .replace(/<(\/)?p>/g, '');

    return `<span data-type="${mathInlineToken.type}" data-katex="true">${latex}</span>`;
  },
};
