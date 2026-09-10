import { isValidMarkdownPath, normalizeMarkdownPath } from './content-path';

describe('content path', () => {
  it('normalizes Windows separators and wildcard arrays', () => {
    expect(normalizeMarkdownPath('web\\event-loop')).toBe('web/event-loop');
    expect(normalizeMarkdownPath(['ui-ux', 'focus-management'])).toBe(
      'ui-ux/focus-management',
    );
  });

  it('accepts only a known channel and one kebab-case leaf', () => {
    expect(isValidMarkdownPath('mobile/safe-area')).toBe(true);
    expect(isValidMarkdownPath('web/nested/event-loop')).toBe(false);
    expect(isValidMarkdownPath('../secrets')).toBe(false);
  });
});
