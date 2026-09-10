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
