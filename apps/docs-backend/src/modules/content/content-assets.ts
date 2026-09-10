import { posix } from 'node:path';

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function resolveAssetUrl(
  reference: string,
  assetBaseUrl: string,
  markdownPath?: string,
): string {
  const value = reference.trim();

  if (!value || value.startsWith('#') || ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }

  const rootRelativePath =
    value.startsWith('./') && markdownPath
      ? posix.join(markdownPath, value)
      : value.replace(/^\/+/, '');
  const normalizedPath = posix.normalize(rootRelativePath);

  if (normalizedPath === '..' || normalizedPath.startsWith('../')) {
    return '';
  }

  return assetBaseUrl ? `${assetBaseUrl}/${normalizedPath}` : normalizedPath;
}
