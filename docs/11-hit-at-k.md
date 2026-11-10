# RAG 학습 15일 차 — Hit@K

## 1. 개념
**Hit@K**는 질문에 대한 검색 결과를 유사도 순으로 정렬했을 때, **상위 K개 안에 정답 문서(Chunk)가 하나라도 있는지** 평가하는 지표다.

- **K**: 검색을 실행하는 횟수가 아니라, **한 번의 검색 결과 중 확인할 상위 문서 개수**
- **Hit = 1**: 상위 K개 안에 정답이 있음
- **Hit = 0**: 상위 K개 안에 정답이 없음
- **Top-K**: 상위 K개를 가져오는 동작 / **Hit@K**: 그 안에 정답이 있는지 평가

## 2. 예시
질문: `ABC 회사의 근무 시간은?`

| 순위 | 검색 결과 | 정답 여부 |
|---|---|---|
| 1위 | 회사 설립 연도 | X |
| 2위 | 개발팀 구성 | X |
| 3위 | 오전 9시~오후 6시 | O |

- Hit@1 = 0
- Hit@2 = 0
- **Hit@3 = 1**

정답이 1위인지 3위인지는 Hit@3만으로 구별할 수 없다.

## 3. 여러 질문을 평가할 때
질문 3개 중 2개에서 상위 3개 안에 정답을 찾았다면:

`평균 Hit@3 = 성공한 질문 수 / 전체 질문 수 = 2 / 3 ≈ 0.6667 (66.67%)`

질문 10개 중 8개를 성공했다면 평균 Hit@3은 `0.8 (80%)`이다.

## 4. TypeScript 코드

```typescript
type SearchResult = { id: number; score: number };

type TestCase = {
  question: string;
  correctIds: number[]; // 정답 Chunk의 ID
  results: SearchResult[]; // 유사도 내림차순 정렬 결과
};

// 질문 1개의 성공 여부 (0 또는 1)
function hitAtK(
  results: SearchResult[],
  correctIds: number[],
  k: number
): number {
  const topK = results.slice(0, k);
  const found = topK.some(result => correctIds.includes(result.id));
  return found ? 1 : 0;
}

// 여러 질문의 평균 성공률
function evaluate(tests: TestCase[], k: number): number {
  let hits = 0;

  for (const test of tests) {
    const hit = hitAtK(test.results, test.correctIds, k);
    hits += hit;
    console.log(test.question, '→', hit);
  }

  const average = hits / tests.length;
  console.log(`Hit@${k}:`, average.toFixed(4));
  return average;
}
```

> `evaluate()`는 직접 검색하지 않는다. **이미 정렬된 검색 결과**를 받아 각 질문에 `hitAtK()`를 적용하고 성공률을 평균 낸다. 실제 프로젝트에서는 질문마다 벡터 검색을 먼저 수행해 `results`를 만들어야 한다.

## 5. evaluate() 한 줄씩 이해하기

| 코드 | 의미 |
|---|---|
| `let hits = 0` | 성공 횟수를 0으로 시작 |
| `for (const test of tests)` | 질문을 하나씩 검사 |
| `hitAtK(test.results, test.correctIds, k)` | 현재 질문의 정답 검색 여부 확인 |
| `hits += hit` | 성공이면 1, 실패면 0 누적 |
| `hits / tests.length` | 전체 질문 중 성공한 비율 계산 |
| `average.toFixed(4)` | 소수점 넷째 자리까지 출력 |

예: 질문별 `hit` 값이 `[1, 1, 0]`이면 `hits = 2`, 질문 수는 `3`, 평균은 `0.6667`이다.

## 6. 관련 용어와 주의점
- **Ground Truth**: 질문별로 미리 지정한 정답 문서 ID 목록. 평가하려면 필요하다.
- **Similarity Score**: 벡터 유사도 점수. 높다고 정답을 반드시 포함하는 것은 아니다.
- **Threshold**: 유사도가 기준 미만인 결과를 제외하는 설정. 실제 RAG의 필터링을 평가하려면 필터링 후 결과로 Hit@K를 계산한다.
- **MRR**: 정답이 몇 위에 나왔는지까지 반영하는 별도의 지표.
- **Chunking 방식이 바뀌면** 문서 ID와 정답 목록도 다시 확인해야 한다.

## 7. 반복 복습 — 핵심 4문장
1. **K는 검색 횟수가 아니라 상위 결과 개수다.**
2. **hitAtK()는 질문 하나를 0 또는 1로 평가한다.**
3. **evaluate()는 여러 질문의 Hit를 더한 뒤 질문 수로 나눈다.**
4. **Hit@K는 정답의 존재 여부만 판단하고, 정확한 순위 차이는 평가하지 않는다.**