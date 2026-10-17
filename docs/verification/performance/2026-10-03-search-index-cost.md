# 검색 인덱스 비용 점검

## 대상과 조건

- 확인일: 2026-10-03, KST. 코드 기준 `6798430`, 배포 코드 `56698ec`.
- Production 배포: `<deployment-id>` (공개 보고서에서는 실제 ID 생략). `/api/search` 읽기 요청 3회, 설정·캐시·콘텐츠 변경 없음.
- 로컬: Node v24.12.0, 실제 Markdown/MDX 16개, 공개 문서 10개, 원문 합계 81,073 bytes.
- 로컬 스캔·파싱 6회. 합성 순위 계산은 조건별 11회 중 첫 회 제외 후 10회의 중앙값과 최댓값.

## 재현 방법

`apps/docs`에서 실행한다. 실제 파서와 순위 함수를 사용하지만 서버 로더 전체를 호출하는 것은 아니다. section은 실험용 경로 첫 segment이며 href 생성·날짜 정렬·원격 병합은 제외한다.

```sh
mise exec -- node --input-type=module <<'NODE'
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {parseLocalDocument} from './lib/local-document-parser.ts';
import {rankSearchDocs} from './lib/search-ranking.ts';
const samples=[];let docs=[];let count=0;let bytes=0;
for(let i=0;i<6;i++){
 const start=performance.now();
 const files=await fg(['data/**/*.{md,mdx}','category/**/*.{md,mdx}'],{absolute:true,cwd:process.cwd()});
 const scanned=performance.now();
 const parsed=await Promise.all(files.map(async file=>{
  const raw=await fs.readFile(file,'utf8');
  return {bytes:Buffer.byteLength(raw),doc:parseLocalDocument(file,path.relative(process.cwd(),file).replace(/\.(mdx|md)$/i,''),raw)};
 }));
 docs=parsed.map(x=>x.doc).filter(Boolean).map(d=>({...d,section:d.fileName.split('/')[0]}));
 count=files.length;bytes=parsed.reduce((n,x)=>n+x.bytes,0);
 samples.push({scanMs:+(scanned-start).toFixed(3),readParseMs:+(performance.now()-scanned).toFixed(3)});
}
const growth=[];
for(const size of [docs.length,100,1000,5000]){
 const corpus=Array.from({length:size},(_,i)=>({...docs[i%docs.length],slug:`${docs[i%docs.length].slug}-${i}`}));
 for(const query of ['React','render performance','__no_match__']){
  const times=[];let matches=0;
  for(let i=0;i<11;i++){
   const start=performance.now();matches=rankSearchDocs(corpus,query).length;
   times.push(performance.now()-start);
  }
  const sorted=times.slice(1).sort((a,b)=>a-b);
  growth.push({size,query,matches,medianMs:+((sorted[4]+sorted[5])/2).toFixed(3),maxMs:+sorted[9].toFixed(3)});
 }
}
console.log(JSON.stringify({node:process.version,files:count,published:docs.length,rawBytes:bytes,samples,growth},null,2));
NODE
```

배포 요청은 `React`, `accessibility`, `React` 순서로 body 수신까지 측정했다. 재확인 시 아래 URL을 호출하고 응답 UUID로 조회한다. 검색어·본문·토큰 원문을 로그에 추가하지 않는다.

```sh
curl -sS -D - -o /dev/null 'https://heap-forge.app/api/search?q=React'
vercel logs --project web-tech --scope hojeong-ims-projects --environment production --since 15m --query '<request-id>' --json --limit 5 --no-follow
```

실제 요청 UUID는 공개 문서에서 생략하고 아래 표에서는 request-1~3으로 구분한다. 재현 시 `<request-id>`를 새 응답 UUID로 교체한다. 최초 3초 뒤 조회는 비어 있었고 재조회에서 단계 로그가 확인됐다. 즉시 빈 결과만으로 계측 누락이라고 단정하지 않는다.

## 결과와 증거

### Production

모두 HTTP 200, cache MISS, 각 stage success. 시간 단위는 ms.

| 요청 ID   | 검색어        | HTTP body 완료 | search-local | search-remote | search-rank |
| --------- | ------------- | -------------: | -----------: | ------------: | ----------: |
| request-1 | React         |        2942.74 |       160.73 |        101.10 |       13.94 |
| request-2 | accessibility |         525.13 |        47.11 |         39.95 |        0.81 |
| request-3 | React         |         580.49 |       159.33 |         42.11 |        1.10 |

첫 요청의 source 로그는 mixed, localCount=10, remoteCount=1, totalCount=11이었다. 원격 span은 캐시 조회·fetch·payload 처리 등을 포함한 함수 시간이지 순수 네트워크 시간이 아니다. HTTP 시간은 측정 컴퓨터의 네트워크·TLS 등도 포함하므로 stage 합계와 같지 않다.

### 로컬과 증가 실험

| 반복 | 스캔 ms | 파일 읽기·파싱 ms |
| ---- | ------: | ----------------: |
| 1    |  12.089 |            16.174 |
| 2    |   2.900 |             5.864 |
| 3    |   1.010 |             4.822 |
| 4    |   0.911 |             6.747 |
| 5    |   0.998 |             3.531 |
| 6    |   0.784 |             4.031 |

파일 읽기·파싱에서 앞선 반복의 OS 캐시 영향을 제거하지 않았다. 첫 반복도 완전한 cold disk 측정은 아니다.

| 합성 문서 수 | React 중앙값 / 최대 ms | render performance 중앙값 / 최대 ms | 미일치 중앙값 / 최대 ms |
| ------------ | ---------------------: | ----------------------------------: | ----------------------: |
| 10           |          0.421 / 0.526 |                       0.403 / 0.910 |           0.409 / 0.568 |
| 100          |          4.402 / 4.708 |                       4.329 / 6.546 |           4.200 / 6.075 |
| 1000         |        45.337 / 87.839 |                     49.243 / 55.226 |         43.293 / 46.975 |
| 5000         |      236.804 / 289.824 |                   222.173 / 271.493 |       215.169 / 305.054 |

증가 실험은 실제 문서 본문을 복제한 CPU 탐색 비용이다. 5000개 파일을 읽은 시험도, 5000개 실제 문서를 운영한 결과도 아니다. React 일치 수는 3/30/300/1500, 두 단어 검색은 1/10/100/500, 미일치는 모두 0이었다.

## 한계와 후속 작업

- 확인: 로더는 매 호출마다 로컬 glob·읽기·파싱을 수행하고 그 뒤 원격 목록을 기다린다. 순위 계산에서는 문서마다 본문을 다시 정규화한다.
- 판단: 현재 공개 로컬 10개에서는 순위 계산 최적화보다 반복 인덱스 생성 제거를 먼저 실험할 가치가 있다. 이번 Production 표본은 로컬 단계도 원격 단계 이상 비용이었으므로 원격 장애만의 문제로 설명하지 않는다.
- 보류: 지속 캐시·검색 엔진 도입 및 timeout 변경은 하지 않았다. 3회 표본으로 p75나 cold start 원인을 판단할 수 없다.
- 다음 실험: 로컬 정규화 인덱스를 별도 캐시 후보로 두고 요청 간 재사용·게시 webhook 무효화·draft 제외·원격 실패 시 로컬 유지 테스트를 먼저 설계한다. 원격 성공 캐시와 실패 응답의 저장 정책은 분리한다.
- 동시 로드는 대기 시간을 줄일 후보지만 작은 로컬 비용만 숨길 수 있고 병목을 제거하지 않는다. 캐시는 오래된 문서 노출 위험이 있어 게시 갱신 검증 없이 적용하지 않는다.
- 재측정: 대표 검색어·긴 본문·동시 요청·더 큰 실제 corpus·배포 cold/warm 구분 후 개선 전후를 비교한다. 이번 결과를 성능 목표나 운영 SLO로 사용하지 않는다.

## 관련 문서

- 측정 후 [로컬 인덱스 캐시 검증](../cache/2026-10-03-local-search-index-cache.md)을 수행했다. 위 측정은 변경 전 기준이며 운영 개선 효과를 뜻하지 않는다.

- [Production 계측 확인](2026-10-03-production-observation.md)
- [배포 측정 절차](../../runbooks/docs-deployed-performance-measurement.md)
- [검색 비용 점검 기록](../../worklog/2026-10/2026-10-03-search-index-cost.md)
