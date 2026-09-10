import {
  CONTENT_CHANNELS,
  MARKDOWN_PATH_PATTERN,
  type ContentChannel,
} from '@web-tech/docs-content-contract';

export { CONTENT_CHANNELS, MARKDOWN_PATH_PATTERN };
export type { ContentChannel };

export const TOPIC_LABEL_BY_CHANNEL: Record<ContentChannel, string> = {
  feed: 'ENGINEERING',
  mobile: 'MOBILE',
  'ui-ux': 'UI/UX',
  web: 'WEB',
};
