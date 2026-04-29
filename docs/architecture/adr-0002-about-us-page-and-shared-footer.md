# ADR-0002: About Us Page and Shared Footer Alignment

- Status: Accepted
- Date: 2026-04-29

## Context

`/about` 페이지는 기존에 간단한 소개 섹션 위주였고, Figma 시안에는 다음 구성이 포함되어 있었습니다.

- 상태/미션 hero
- 3개 pillar grid
- creator profile
- contact form
- shared footer variation

또한 top navigation과 footer는 페이지별로 따로 만들기보다 app shell에서 공유하는 구조가 이미 존재했습니다.

## Decision

다음과 같이 정리합니다.

- `/about`는 `apps/docs/widgets/about-us/ui/about-us.tsx`를 사용해 Figma 기반 메인 콘텐츠를 렌더링합니다.
- top navigation과 footer는 여전히 글로벌 layout에서 공유합니다.
- About Figma 안에 포함된 top nav/footer는 별도 페이지 내부가 아니라 shared layout 스타일의 기준으로만 사용합니다.
- footer는 최신 About Figma 버전에 맞춰 `brand + copyright` 왼쪽, 링크 그룹 오른쪽 구조로 정렬합니다.

## Consequences

장점:

- about 페이지가 Figma 정보 구조와 더 가깝게 정렬됩니다.
- global chrome 중복 없이 app shell 재사용이 유지됩니다.
- footer 정렬이 다른 페이지에서도 일관되게 적용됩니다.

주의:

- creator social links와 footer links는 현재 placeholder href를 사용합니다.
- contact form은 시각적 구현만 되어 있고 전송 로직은 아직 연결되지 않았습니다.

## Follow-up

- about contact form 실전 전송 로직 연결
- social/footer 링크 실제 라우트 또는 외부 URL 연결
- about 이미지/asset을 로컬 정식 자산으로 대체할지 검토
