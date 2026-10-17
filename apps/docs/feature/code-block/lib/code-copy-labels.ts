export function getCodeCopyLabels(locale: string) {
    return locale === 'en'
        ? {
              idle: { text: 'Copy', announcement: 'Copy code' },
              copied: { text: 'Copied', announcement: 'Code copied' },
              error: {
                  text: 'Copy failed',
                  announcement: 'Failed to copy code',
              },
          }
        : {
              idle: { text: '복사', announcement: '코드 복사' },
              copied: { text: '복사됨', announcement: '코드가 복사되었습니다' },
              error: {
                  text: '복사 실패',
                  announcement: '코드 복사에 실패했습니다',
              },
          }
}
