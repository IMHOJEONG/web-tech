import { Injectable } from '@nestjs/common';
import MarkdownIt from 'markdown-it';

import { ContentConfigService } from '../../config/content-config.service';
import { resolveAssetUrl } from './content-assets';

@Injectable()
export class MarkdownRendererService {
  private readonly markdown: MarkdownIt;

  constructor(private readonly config: ContentConfigService) {
    this.markdown = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: false,
    });

    const defaultImageRenderer =
      this.markdown.renderer.rules.image ??
      ((tokens, index, options, _environment, renderer) =>
        renderer.renderToken(tokens, index, options));

    this.markdown.renderer.rules.image = (
      tokens,
      index,
      options,
      environment,
      renderer,
    ) => {
      const source = tokens[index]?.attrGet('src');
      const markdownPath = getMarkdownPath(environment);

      if (source) {
        tokens[index]?.attrSet(
          'src',
          resolveAssetUrl(source, this.config.assetBaseUrl, markdownPath),
        );
      }

      return defaultImageRenderer(
        tokens,
        index,
        options,
        environment,
        renderer,
      );
    };
  }

  render(body: string, markdownPath: string): string {
    return this.markdown.render(body, { markdownPath });
  }

  extractSearchText(body: string): string {
    return this.markdown
      .parse(body, {})
      .map((token) => {
        if (token.type === 'inline') {
          return inlineSearchText(token.children ?? []);
        }
        if (token.type === 'fence' || token.type === 'code_block') {
          return token.content;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .normalize('NFC')
      .replace(/\s+/gu, ' ')
      .trim();
  }
}

type SearchToken = {
  type: string;
  content: string;
  children: SearchToken[] | null;
};

function inlineSearchText(tokens: readonly SearchToken[]): string {
  return tokens
    .map((token) => {
      if (token.children) return inlineSearchText(token.children);
      if (token.type === 'text' || token.type === 'code_inline') {
        return token.content;
      }
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
      return '';
    })
    .join('');
}

function getMarkdownPath(environment: unknown): string | undefined {
  if (
    typeof environment === 'object' &&
    environment !== null &&
    'markdownPath' in environment &&
    typeof environment.markdownPath === 'string'
  ) {
    return environment.markdownPath;
  }

  return undefined;
}
