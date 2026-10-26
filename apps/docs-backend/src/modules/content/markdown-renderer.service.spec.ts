import { ContentConfigService } from '../../config/content-config.service';
import { MarkdownRendererService } from './markdown-renderer.service';

describe('published body search text', () => {
  const renderer = new MarkdownRendererService({
    assetBaseUrl: 'https://assets.example.test',
  } as ContentConfigService);

  it.each([
    [
      '## Micro**task** queue\n\nA *visible* phrase.',
      'Microtask queue A visible phrase.',
    ],
    [
      '[Visible label](https://hidden.example.test) ![Flow diagram](./hidden.webp)',
      'Visible label Flow diagram',
    ],
    ['Use `Promise<T>` and &amp; entities.', 'Use Promise<T> and & entities.'],
    ['```tsx\nconst task = () => true;\n```', 'const task = () => true;'],
    ['    const indented = true;\n', 'const indented = true;'],
    [
      '> Quoted\n\n- First\n- Second\n\n| Name |\n| --- |\n| Value |',
      'Quoted First Second Name Value',
    ],
    ['## Cafe\u0301\n\n  Korean\n  text', 'Caf\u00e9 Korean text'],
    ['', ''],
  ])('extracts readable text from %j', (body, expected) => {
    expect(renderer.extractSearchText(body)).toBe(expected);
  });

  it('does not execute raw HTML and keeps rendering separate from search', () => {
    const body = '## Topic\n\n<script>searchMarker()</script>';
    expect(renderer.extractSearchText(body)).toContain('searchMarker()');
    expect(renderer.render(body, 'web/topic')).toContain('&lt;script&gt;');
  });
});
