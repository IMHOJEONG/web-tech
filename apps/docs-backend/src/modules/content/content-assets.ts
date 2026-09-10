import { posix } from 'node:path';

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function resolveAssetUrl(
  reference: string,
  assetBaseUrl: string,
  documentAssetNamespace?: string,
): string {
  const value = reference.trim();

  if (!value || value.startsWith('#') || ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }

  // This is intentionally not filesystem-relative: `./` maps to the
  // `assets/{channel}/{slug}` namespace paired with `posts/{channel}/{slug}.md`.
  const rootRelativePath =
    value.startsWith('./') && documentAssetNamespace
      ? posix.join(documentAssetNamespace, value)
      : value.replace(/^\/+/, '');
  const normalizedPath = posix.normalize(rootRelativePath);

  if (normalizedPath === '..' || normalizedPath.startsWith('../')) {
    return '';
  }

  return assetBaseUrl ? `${assetBaseUrl}/${normalizedPath}` : normalizedPath;
}
