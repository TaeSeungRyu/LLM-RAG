# LLM / RAG 학습 16일 차 — MRR

## 1. MRR이란?

**MRR(Mean Reciprocal Rank)** 은 검색 결과에서 첫 번째 정답 문서가 얼마나 높은 순위에 나타나는지 평가하는 지표이다.

- 정답이 1위에 있으면 가장 좋은 점수를 받는다.
- 정답이 뒤쪽에 있을수록 점수가 낮아진다.
- 정답을 찾지 못하면 0점이다.

**핵심: 정답을 찾았는지뿐 아니라 몇 위에서 찾았는지를 평가한다.**

---

## 2. Hit@K와 MRR의 차이

| 구분 | Hit@K | MRR |
|---|---|---|
| 목적 | 정답 존재 여부 평가 | 첫 정답의 순위 평가 |
| 정답 1위 | 1 | 1 |
| 정답 2위 | 1 (K≥2) | 0.5 |
| 정답 3위 | 1 (K≥3) | 0.333 |
| 정답 없음 | 0 | 0 |
| 여러 질문 | Hit의 평균 | RR의 평균 |

### 기억할 내용

- **K:** 검색 결과 상위 몇 개까지 확인할지
- **Hit@K:** 상위 K개 안에 정답이 존재하는가?
- **RR:** 질문 하나에서 첫 정답이 몇 위에 있는가?
- **MRR:** 여러 질문의 RR 평균

---

## 3. RR 계산 방법

RR(Reciprocal Rank)은 첫 번째 정답 문서의 순위를 이용해 계산한다.

```text
RR = 1 / 첫 번째 정답의 순위
```

| 첫 정답 순위 | RR |
|---|---|
| 1위 | 1.000 |
| 2위 | 0.500 |
| 3위 | 0.333 |
| 4위 | 0.250 |
| 5위 | 0.200 |
| 정답 없음 | 0 |

예를 들어 검색 결과가 다음과 같다면:

```text
질문: ABC 회사의 근무 시간은?

1위: ABC 회사의 주요 사업
2위: ABC 회사의 개발팀
3위: ABC 회사의 근무 시간 ← 정답
```

첫 번째 정답이 3위이므로:

```text
RR = 1 / 3 = 0.333
```

**주의:** RR은 질문 하나에 대한 점수이고, MRR은 여러 질문의 RR 평균이다.

---

## 4. MRR 계산 방법

질문이 3개 있다고 가정한다.

| 질문 | 첫 정답 순위 | RR |
|---|---|---|
| 근무 시간은? | 1위 | 1 |
| 사용하는 DB는? | 2위 | 0.5 |
| 주요 사업은? | 정답 없음 | 0 |

```text
MRR = (1 + 0.5 + 0) / 3

MRR = 0.5
```

MRR은 0부터 1까지의 값을 가진다.

- 1에 가까울수록 정답이 상위에 나타난다.
- 0에 가까울수록 정답이 뒤쪽에 있거나 검색되지 않는다.

---

## 5. TypeScript 구현

### 5.1 질문 하나의 RR 계산

```typescript
type SearchResult = {
  id: number;
  score: number;
};

function reciprocalRank(
  results: SearchResult[],
  correctIds: number[],
  k: number
): number {

  // 상위 K개 결과만 확인
  const topK = results.slice(0, k);

  // 첫 번째 정답의 배열 위치
  const index = topK.findIndex(result =>
    correctIds.includes(result.id)
  );

  // 정답이 없으면 0
  if (index === -1) {
    return 0;
  }

  // 배열 위치를 실제 순위로 변환
  return 1 / (index + 1);
}
```

**핵심 함수**

- `slice(0, k)`: 상위 K개만 가져온다.
- `findIndex()`: 첫 번째 정답의 위치를 찾는다.
- `includes()`: 정답 ID 목록에 포함되는지 확인한다.

배열은 0부터 시작하므로 `index + 1`이 실제 순위이다.

### 5.2 여러 질문의 MRR 계산

```typescript
type TestCase = {
  question: string;
  correctIds: number[];
  results: SearchResult[];
};

function evaluateMRR(
  tests: TestCase[],
  k: number
): number {

  let total = 0;

  for (const test of tests) {

    const rr = reciprocalRank(
      test.results,
      test.correctIds,
      k
    );

    total += rr;

    console.log(test.question, rr);
  }

  const mrr = total / tests.length;

  console.log(`MRR@${k}:`, mrr.toFixed(4));

  return mrr;
}
```

`tests`에는 하나 이상의 테스트 질문이 들어 있다고 가정한다.

### evaluateMRR() 실행 흐름

```text
테스트 질문 3개
       ↓
첫 번째 질문 RR 계산 → 1
       ↓
두 번째 질문 RR 계산 → 0.5
       ↓
세 번째 질문 RR 계산 → 0
       ↓
RR 합계 = 1.5
       ↓
전체 질문 수 = 3
       ↓
MRR = 1.5 / 3 = 0.5
```

---

## 6. MRR@K란?

`MRR@3`은 검색 결과 상위 3개까지만 확인하여 MRR을 계산한다는 의미이다.

예를 들어 첫 번째 정답이 4위에 있다면:

- `MRR@3` 계산 시 RR = 0
- `MRR@5` 계산 시 RR = 0.25

따라서 평가할 때는 K값을 동일하게 설정해야 공정하게 비교할 수 있다.

---

## 7. 좋은 RAG 검색 시스템의 조건

이상적인 검색 시스템은 다음 두 가지를 동시에 만족한다.

1. **작은 K값에서도 Hit@K가 높다.**
2. **MRR 값이 높다.**

예시:

```text
Hit@3 = 0.95
MRR@3 = 0.92
```

의미:

- 질문의 95%에서 상위 3개 안에 정답을 찾았다.
- 첫 정답이 대체로 높은 순위에 나타났다.

다만 이 수치가 실제 서비스에서도 좋은 성능을 보장하는 것은 아니다. 평가 질문과 정답 데이터의 품질도 중요하다.

또한 Hit@K와 MRR은 검색 품질 지표이며, LLM이 최종 답변을 정확하게 생성하는지까지 보장하지는 않는다.

---

## 8. 최종 암기

**Hit@K = 정답을 찾았는가?**

**RR = 첫 정답이 몇 위에 있는가?**

**MRR = 여러 질문에서 첫 정답의 순위가 얼마나 좋은가?**

**좋은 RAG 검색 = 작은 K에서도 높은 Hit@K + 높은 MRR**

### 다음 학습

17일 차: Hit@K와 MRR을 통합하고, 실제 SQLite 벡터 검색 결과에 적용하여 검색 품질을 평가한다.