import { MARKDOWN_PATH_PATTERN } from './content.constants';

export function normalizeMarkdownPath(value: string | string[]): string {
  return (Array.isArray(value) ? value.join('/') : value)
    .replaceAll('\\', '/')
    .replace(/^\/+|\/+$/g, '');
}

export function isValidMarkdownPath(value: string): boolean {
  return MARKDOWN_PATH_PATTERN.test(value);
}

export function getLeafSlug(markdownPath: string): string {
  return markdownPath.slice(markdownPath.lastIndexOf('/') + 1);
}
