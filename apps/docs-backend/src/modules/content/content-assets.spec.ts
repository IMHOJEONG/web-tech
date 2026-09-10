import { resolveAssetUrl } from './content-assets';

describe('resolveAssetUrl', () => {
  it('resolves dot-relative assets inside the document asset namespace', () => {
    expect(
      resolveAssetUrl(
        './diagram.webp',
        'https://assets.heap-forge.app',
        'web/event-loop',
      ),
    ).toBe('https://assets.heap-forge.app/web/event-loop/diagram.webp');
  });

  it('rejects paths that escape the asset root', () => {
    expect(
      resolveAssetUrl('../../secret.txt', 'https://assets.heap-forge.app'),
    ).toBe('');
  });
});
