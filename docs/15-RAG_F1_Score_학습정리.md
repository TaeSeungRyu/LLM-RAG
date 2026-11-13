# RAG 검색 평가 — F1 Score 학습 정리

> 목적: F1 Score의 뜻, 계산법, 사용 이유, 실제 RAG 평가 절차를 반복해서 복습하기 위한 노트

## 1. 한 문장 정의

**F1 Score는 Precision(정밀도)과 Recall(재현율)의 조화평균으로, 두 지표의 균형을 하나의 숫자로 표현하는 평가 지표다.**

- Precision@K: 검색한 상위 K개 중 관련 Chunk의 비율
- Recall@K: 전체 관련 Chunk 중 상위 K개에서 찾은 비율
- F1@K: 이 둘을 동일한 비중으로 종합한 값

F1의 범위는 0~1이며, 높을수록 두 지표가 함께 좋은 편이다. **F1은 최종 LLM 답변의 정확도를 직접 측정하지 않는다.**

## 2. 계산 공식

```text
Precision@K = (상위 K개 중 관련 Chunk 수) / K
Recall@K    = (상위 K개 중 관련 Chunk 수) / (전체 관련 Chunk 수)
F1@K        = 2 × Precision@K × Recall@K / (Precision@K + Recall@K)
```

두 값이 모두 0이면 F1은 0으로 처리한다. 전체 관련 Chunk가 없는 질문은 Recall의 분모가 0이므로 평가 정책을 별도로 정해야 한다.

### 직접 풀어본 예제

- 전체 관련 Chunk: 10개
- K = 5
- 상위 5개에서 찾은 관련 Chunk: 3개

```text
Precision@5 = 3 / 5  = 0.6 = 60%
Recall@5    = 3 / 10 = 0.3 = 30%
F1@5        = 2 × 0.6 × 0.3 / (0.6 + 0.3)
            = 0.36 / 0.9
            = 0.4 = 40%
```

**주의:** `(60% + 30%) / 2 = 45%`는 산술평균이다. F1은 **조화평균**이므로 **40%**다.

## 3. 왜 조화평균을 사용하는가?

Precision 또는 Recall 중 하나만 높아도 좋은 점수를 주는 일을 줄이기 위해서다.

| Precision | Recall | F1 | 해석 |
|---:|---:|---:|---|
| 1.0 | 0.2 | 0.3333 | 검색 결과는 깨끗하지만 관련 정보를 많이 놓침 |
| 0.8 | 0.4 | 0.5333 | 정밀도는 높지만 재현율이 낮음 |
| 0.8 | 0.8 | 0.8000 | 두 지표가 모두 높음 |
| 0.5 | 0.5 | 0.5000 | 두 지표가 모두 보통 |
| 1.0 | 1.0 | 1.0000 | 관련 정보를 빠짐없이, 불필요한 결과 없이 검색 |

F1은 균형을 평가하지만 **Precision과 Recall의 값 자체를 대체하지는 못한다.** 같은 F1이라도 실제 서비스에 미치는 영향은 다를 수 있다.

## 4. 무엇을, 왜, 어떻게 하는가?

### 무엇을 하는가?

RAG의 검색 결과를 평가해 검색 설정 A와 B를 비교한다. 예를 들면:

- Chunk 크기나 Overlap 변경
- Embedding 모델 변경
- Top-K 변경
- 유사도 Threshold 변경
- Re-ranking 도입 전후 비교

### 왜 하는가?

유사도 점수(예: 0.82)는 정답률 82%라는 뜻이 아니다. F1은 사람이 정의한 관련 Chunk 정답지와 실제 검색 결과를 비교해 검색 품질을 평가한다.

### 어떻게 하는가? (오프라인 평가 6단계)

1. **평가 질문 세트 준비:** 실제 서비스 질문을 대표하는 여러 질문을 만든다.
2. **정답지 작성:** 각 질문과 관련된 **모든 Chunk ID**를 표시한다. 관련 Chunk가 여러 개일 수 있다.
3. **검색 실행:** 같은 질문으로 설정 A와 설정 B를 검색한다.
4. **지표 계산:** 질문별 Precision@K, Recall@K, F1@K를 계산한다.
5. **집계:** 질문별 F1의 평균(Macro F1) 등을 비교한다. 질문 간 총 개수를 합쳐 계산하는 방식과 구별한다.
6. **최종 판단:** F1뿐 아니라 Hit@K, MRR, 지연시간, 비용, 최종 답변 품질도 함께 본다.

### 예시: 검색 A vs 검색 B

| 지표 | 검색 A | 검색 B |
|---|---:|---:|
| Precision@5 | 0.80 | 0.70 |
| Recall@5 | 0.40 | 0.70 |
| F1@5 | 0.5333 | 0.7000 |

이 예제에서 Precision과 Recall을 동등하게 중요하게 본다면 검색 B가 유리하다. 하지만 법률·의료 등에서는 관련 정보 누락 비용이 클 수 있고, 작은 컨텍스트 예산에서는 불필요한 Chunk의 비용이 클 수 있으므로 서비스 목적에 맞춰 결정해야 한다.

## 5. TypeScript 계산 코드 (독립 실행 가능)

아래 코드는 현재 프로젝트의 자료형이나 DB 구조를 변경하지 않는 독립 예제다.

```typescript
function calculateF1(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

const totalRelevant = 10;
const k = 5;
const retrievedRelevant = 3;

const precision = retrievedRelevant / k;
const recall = retrievedRelevant / totalRelevant;
const f1 = calculateF1(precision, recall);

console.log(`Precision@${k}: ${precision.toFixed(4)}`); // 0.6000
console.log(`Recall@${k}: ${recall.toFixed(4)}`);       // 0.3000
console.log(`F1@${k}: ${f1.toFixed(4)}`);               // 0.4000
```

### 기존 evaluate-rag.ts에 적용할 때

- 기존 `documents`, `results`, `test.expected`, `K`를 사용하는 간단한 학습 버전에서는 전체 문서 중 `expected` 문자열을 포함한 문서 수를 `totalRelevant`로 계산할 수 있다.
- 다만 문자열 일치 방식은 **근사 평가**일 뿐이다. 표현이 다른 관련 Chunk를 놓치거나, Overlap으로 복제된 Chunk를 관련 문서로 중복 계산할 수 있다.
- 정확한 평가를 위해서는 테스트 질문마다 `relevantChunkIds` 같은 정답지 목록을 마련하는 것이 좋다.
- 관련 Chunk가 0개인 질문은 Recall/F1 처리 정책을 별도로 정하고, 조용히 0점으로 간주해 평균에 넣지 않도록 주의한다.

## 6. F1을 해석할 때 흔한 실수

1. **F1 = Precision과 Recall의 단순 평균** → 틀림. 조화평균이다.
2. **F1이 0.8이면 답변 정확도가 80%** → 틀림. 검색 평가 지표다.
3. **F1이 높으면 언제나 최선** → 틀림. 서비스별 누락·노이즈 비용이 다르다.
4. **운영 중 모든 질문의 F1을 즉시 알 수 있다** → 일반적으로 틀림. 정답지 또는 검증된 관련성 라벨이 필요하다.
5. **F1@K는 검색 순위도 평가한다** → 직접적으로는 아니다. 같은 상위 K개 내 관련 Chunk 수라면 순서가 바뀌어도 F1은 같다. 순위는 RR/MRR 등으로 별도 평가한다.
6. **K를 바꾸어 얻은 F1은 무조건 공정한 비교** → K 자체가 바뀌면 검색 문서 수, 비용, 답변 품질도 달라진다. 동일한 평가 세트에서 다른 지표와 함께 해석해야 한다.

## 7. 기존 지표와 한눈에 비교

| 지표 | 핵심 질문 |
|---|---|
| Hit@K | K개 안에 관련 Chunk가 하나라도 있는가? |
| RR | 첫 관련 Chunk가 몇 위인가? |
| MRR | 여러 질문에서 첫 관련 Chunk 순위가 평균적으로 좋은가? |
| Precision@K | 검색한 K개 중 얼마나 관련 있는가? |
| Recall@K | 전체 관련 Chunk 중 얼마나 찾았는가? |
| **F1@K** | 정밀도와 재현율을 함께 고려하면 얼마나 좋은가? |

## 8. 암기 문장

> **Precision = 가져온 것 중 정답 비율**  
> **Recall = 전체 정답 중 가져온 비율**  
> **F1 = 두 비율의 균형을 보는 점수**

## 9. 복습 문제

**문제 1.** 전체 관련 Chunk 10개, K=5, 관련 Chunk 3개 검색. Precision, Recall, F1은?

**문제 2.** Precision=1.0, Recall=0.5일 때 F1은?

**문제 3.** 상위 K개의 검색 결과 순서만 바꾸고 관련 Chunk 수는 동일하다면 F1@K가 달라지는가?

### 정답

1. Precision=0.6, Recall=0.3, F1=0.4
2. F1 = 2 × 1.0 × 0.5 / 1.5 = 0.6667
3. 달라지지 않는다. F1은 상위 K개 안의 관련 Chunk 수를 사용하며, 순위 자체는 반영하지 않는다.
