# 2026-05-05 Docs 로케일 인지형 메타데이터와 검증

## 요약

- request 기반 locale 해석을 추가해 `next-intl` locale 고정을 해제
- root metadata와 `about` page metadata를 locale-aware 하게 전환
- `about` contact form에 locale-aware validation 메시지를 추가

## 변경 내용

- `apps/docs/shared/message/request.ts`
- `apps/docs/app/layout.tsx`
- `apps/docs/app/about/page.tsx`
- `apps/docs/widgets/about-us/ui/contact-form.tsx`
- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/architecture/docs-next-intl-usage-policy.md`

## 메모

- locale 우선순위는 `NEXT_LOCALE` cookie -> `Accept-Language` header -> `en` fallback 순으로 정리했다.
- metadata는 Next metadata API로 옮기고, 수동 `<meta>` 하드코딩은 제거했다.
- `about` 문의 폼은 실제 전송 연동 전 단계로 보고, 현재는 입력 검증과 locale-aware validation 메시지까지 반영했다.
