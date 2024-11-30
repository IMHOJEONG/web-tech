### React Query의 staleTime, cacheTime

- staleTime = 캐사된 데이터를 얼마나 오래 "fresh"하다고 간주할 지

  - 해당 시간 동안 데이터는 재요청 없이 신선한 상태로 유지됨

- cacheTime = 사용되지 않을 때, 메모리에서 언제 제거할지를 관리하는 데 도움을 줌

  - 사용되지 않는 데이터가 메모리에서 자동으로 제거되기까지 걸리는 시간을 의미

### cacheTime < staleTime 의 경우

- 데이터가 여전히 신선한 상태임에도 캐시에서 삭제될 수 있음

- 데이터가 삭제된 이후에 해당 데이터가 필요할 때, 불필요한 로딩 상태가 발생하고 서버에서 다시 데이터를 가져와야 할 수 있음

### cacheTime > staleTime 의 경우 (cacheTime을 staleTime보다 길게 설정)

- 신선한 데이터가 캐시에 남아, 사용자가 동일한 데이터를 짧은 시간 내에 다시 요청하더라도 네트워크 요청을 줄이고 로딩 시간을 최적화할 수 있음

https://www.codemzy.com/blog/react-query-cachetime-staletime

---



### Abort Signal

- fetch와 axios와 같은 비동기 요청을 중단할 때 사용됨

- 특히, 네트워크 요청을 관리하는 데 유용 & 불필요한 요청을 줄여 성능을 최적화 & 데이터 일관성을 유지하는 데 도움을 줌

- JavaScript의 AbortController에서 비롯된 abort signal

    - 네트워크 요청을 중단시키기 위한 일종의 신호

    - AbortController 인스턴스를 만들고, 이를 사용하여 요청을 중단 가능

    - abort signal을 특정 요청에 전달하고, AbortController의 abort 메서드를 호출하면 해당 요청이 즉시 중단

### @tanstack-query에서는?

- queryFn 함수 내부에서 사용됨

- 사용자가 페이지를 떠나거나, 컴포넌트가 언마운트될 때 불필요한 데이터 페칭을 중단하고자 할 때 유용

```js
import { useQuery } from '@tanstack/react-query';

const fetchData = async ({ signal }) => {
  const response = await fetch('https://api.example.com/data', { signal });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const MyComponent = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error occurred';

  return <div>{JSON.stringify(data)}</div>;
};
```

### Abort Signal 사용 사례

- 사용자가 요청 중에 페이지를 이동할 때 = 네트워크 요청이 완료되지 않은 상태에서 페이지를 이동하면, 해당 요청이 불필요해지므로 중단

- 빠르게 변화하는 검색 필터 = 사용자가 입력하는 검색어에 따라 API 요청이 빈번하게 발생할 때, 이전 요청을 중단하고 최신 요청만 유지함 => 서버 부하를 줄일 수 있음

### 주의

- Abort Signal을 사용하면, 중단된 요청에 대해 AbortError가 발생할 수 있음

- 이 에러를 핸들링하여, 사용자가 볼 필요 없는 에러 메시지를 숨기거나, 중단된 요청임을 사용자에게 안내하는 것이 좋음

- Abort Signal = 불필요한 네트워크 요청을 줄이고, 성능을 최적화하는 데 중요한 역할을 함



