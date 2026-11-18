# Corrective RAG 학습 정리: Search vs Merge

> 학습 대상: `src/corrective-rag-search.ts` , `src/corrective-rag-merge.ts`   
> 환경: TypeScript / Node.js / Ollama (`qwen3:1.7b`, `embeddinggemma`) / SQLite

## 1. 한눈에 보는 차이

| 항목 | corrective-rag-search.ts | corrective-rag-merge.ts  |
|---|---|---|
| 핵심 목적 | 참고자료가 부족하면 **질문을 바꿔 재검색** | 재검색 시 **이전 검색 결과도 보존하여 병합** |
| 최초 검색 | 질문 임베딩 → DB 검색 → Re-ranking | 동일 |
| 자료 충분성 평가 | `evaluateContext(question, context)` | 동일 |
| 부족할 때 | `rewriteQuestion()` 후 다시 검색 | `rewriteQuestion()` 후 다시 검색 |
| 이전 Chunk 처리 | 재검색 시 이전 결과를 **버림** | `candidatePool`에 **누적** |
| 중복 제거 | 별도 병합 없음 | `Map<Chunk ID, SearchResult>`로 중복 제거 |
| Re-ranking 대상 | 해당 회차의 검색 결과 | 지금까지 모인 전체 후보 |
| 최종 답변 생성 | 원래 질문 + 선택된 Context | 동일 |
| 답변 품질 평가 | Faithfulness / Relevance | 동일 |

**핵심:** 28일 차는 **재검색**, 29일 차는 **재검색 결과의 누적·병합·중복 제거 후 재정렬**입니다.

## 2. `corrective-rag-search.ts` 처리 흐름

```text
원래 질문(question)
    ↓
검색 질문(searchQuestion = question)
    ↓
getEmbedding(searchQuestion)
    ↓
searchDocuments(searchQuestion, CANDIDATE_K)
    ↓
rerankDocuments(searchQuestion, candidates)
    ↓
상위 FINAL_K개 → context
    ↓
evaluateContext(question, context)
    ├─ 부족함 → rewriteQuestion(question, reason)
    │             ↓
    │          searchQuestion 변경 → 다음 검색 회차
    │
    └─ 충분함 → generateAnswer(question, context, feedback)
                     ↓
                 evaluateAnswer(question, context, answer)
                     ├─ 통과 → 답변 반환
                     └─ 실패 → feedback 반영해 재생성
                                  ↓
                              최대 횟수 실패 → 대체 메시지
```

### 주요 코드

```ts
let searchQuestion = question;

for (let searchAttempt = 1; searchAttempt <= MAX_SEARCH_ATTEMPTS; searchAttempt++) {
  const candidates = await searchDocuments(searchQuestion, CANDIDATE_K);
  const reranked = await rerankDocuments(searchQuestion, candidates);
  const context = buildContext(reranked.slice(0, FINAL_K));
  const sufficiency = await evaluateContext(question, context);

  if (!sufficiency.sufficient) {
    if (searchAttempt < MAX_SEARCH_ATTEMPTS) {
      searchQuestion = await rewriteQuestion(question, sufficiency.reason);
    }
    continue;
  }

  // context가 충분하면 원래 question으로 답변 생성·평가
}
```

`continue`는 **바깥쪽 검색 반복문의 다음 회차**로 이동합니다. 재작성된 `searchQuestion`으로 새로운 질문 임베딩과 유사도 계산이 수행됩니다.

## 3. `corrective-rag-merge.ts` 처리 흐름

```text
1차 검색: A, B, C
      ↓
candidatePool = {A, B, C}
      ↓
원래 질문 기준 Re-ranking → Context 충분성 평가
      ↓ 부족
질문 재작성 → 2차 검색: C, D, E
      ↓
기존 Pool + 새 검색 결과
      ↓
ID 중복 제거 → {A, B, C, D, E}
      ↓
원래 질문 기준 전체 후보 Re-ranking
      ↓
상위 FINAL_K개 선택 → Context 충분성 평가
      ↓ 충분
답변 생성 → Faithfulness / Relevance 평가 → 최종 답변
```

### 29일 차에 새로 추가된 핵심 코드

```ts
// 검색 회차 밖에 선언: 검색을 반복해도 결과가 유지됨
const candidatePool = new Map<number, SearchResult>();

// 매 회차 검색
const candidates = await searchDocuments(searchQuestion, CANDIDATE_K);

// 기존 후보 + 새 후보 병합, 같은 Chunk ID 중복 제거
mergeDocuments(candidatePool, candidates);

// 누적된 후보 전체를 원래 질문 기준으로 재평가
const reranked = await rerankDocuments(
  question,
  [...candidatePool.values()]
);

const selected = reranked.slice(0, FINAL_K);
const context = buildContext(selected);
```

`Map`의 Key는 Chunk ID입니다. 동일한 ID가 다시 나오더라도 한 번만 저장합니다. 기존 구현은 중복 ID의 `score`가 더 높을 때 이를 갱신합니다.

## 4. `question`, `searchQuestion`, `context` 차이

| 변수 | 의미 | 사용처 |
|---|---|---|
| `question` | 사용자가 입력한 **원래 질문** | 충분성 평가, 병합 후 Re-ranking, 답변 생성·평가 |
| `searchQuestion` | 검색에 맞게 수정 가능한 질문 | 질문 임베딩, Vector DB 검색, 28일 차 Re-ranking |
| `context` | 최종 선택된 Chunk의 실제 텍스트 | 충분성 평가, 최종 답변 생성·평가 |
| `feedback` | 생성 답변에 대한 평가 의견 | 동일 Context로 답변 재생성 |
| `candidatePool` | 지금까지 검색한 Chunk 후보 | **29일 차에만** 사용 |

**중요:** `searchQuestion`은 최종 답변 생성 함수에 직접 전달되지 않습니다. 대신 `searchQuestion`으로 검색한 Chunk가 `context`에 들어가므로 **간접적으로 최종 답변에 영향을 줍니다**.

## 5. Re-ranking 점수는 다시 계산될까?

**현재 29일 차 코드에서는 다시 계산합니다.** 병합 후 A~F 전체를 `rerankDocuments(question, ...)`에 넘기기 때문입니다.

그러나 A~F를 **한 번의 LLM 요청에 모두 넣는 방식이 아닙니다**. 현재 구현은 `for (const doc of documents)`로 **Chunk 하나씩** LLM에 전달하여 관련성 점수를 매깁니다.

예시:

| Chunk | 최초 평가 | 병합 후 평가 |
|---|---:|---:|
| A | 8 | 8 |
| B | 7 | 7 |
| C | 6 | 6 |
| D | — | 9 |
| E | — | 5 |
| F | — | 4 |

최종 정렬: **D → A → B → C → E → F**.

- 같은 질문·문서·프롬프트라면 기존 점수를 **캐싱하여 재활용할 수도** 있습니다.
- 현재 코드는 실제로 재평가하므로 LLM의 출력 변동에 따라 A~C 점수가 달라질 수 있습니다 (`temperature: 0`이어도 절대 보장은 아님).
- A~F 전체를 **동시에 상대 비교**하도록 프롬프트를 바꾼다면, 새로운 문서 추가 자체가 기존 문서 점수에 영향을 줄 수 있습니다. **현재 구현은 이 방식이 아닙니다.**

## 6. 답변 품질 평가와 검색 품질 평가

| 평가 | 함수 | 질문 |
|---|---|---|
| Context Sufficiency | `evaluateContext()` | 검색된 자료만으로 답변 가능한가? |
| Faithfulness | `evaluateAnswer()` | 생성된 답변의 주장이 자료에 근거하는가? |
| Answer Relevance | `evaluateAnswer()` | 생성된 답변이 질문에 적절히 답하는가? |

정답(Ground Truth)이 없어도 위 평가를 시도할 수 있지만, **LLM의 판단이므로 정확성을 보장하지는 않습니다**.

## 7. 실제 코드의 한계 및 주의점

1. **SQLite 검색 방식:** 현재 `searchDocuments()`는 `getDocuments()`로 전체 Chunk를 읽고 TypeScript에서 코사인 유사도를 계산합니다. 전문 Vector DB의 인덱스 기반 검색과는 다릅니다.
2. **재검색 효과가 없을 수 있음:** DB의 Chunk가 적거나 `CANDIDATE_K`가 크면 질문을 바꿔도 같은 Chunk가 나옵니다.
3. **Top-K 제한:** 병합된 후보가 많아도 최종 `FINAL_K`개만 Context에 들어갑니다. 정답이 여러 Chunk에 분산되어 있으면 누락될 수 있습니다.
4. **비용:** 29일 차는 누적된 모든 후보를 다시 LLM Re-ranking하므로 호출 횟수가 늘어납니다. 캐싱으로 개선할 수 있습니다.
5. **유사도 점수 비교:** 서로 다른 검색 질문으로 얻은 코사인 유사도 점수는 기준이 다릅니다. `mergeDocuments()`의 최대 점수 저장은 편의적인 구현이며, 점수만으로 문서의 절대 품질을 비교하지 않아야 합니다.
6. **재시도 한도:** 검색 재시도와 답변 재생성에는 각각 최대 횟수가 있으며, 실패 시 안전한 대체 메시지를 반환합니다.
7. **문서 재처리 불필요:** 재검색한다고 원본 문서를 다시 Chunking하거나 기존 문서의 Embedding을 재생성하는 것은 아닙니다. **검색 질문만 다시 임베딩**합니다.

## 8. 최종 요약

- **28일 차:** “자료가 부족하네? 질문을 고쳐서 **다시 검색**하자.”
- **29일 차:** “다시 검색하되 이전에 찾은 자료도 **모아서 중복 제거 후 전체 Re-ranking**하자.”
- 두 방식 모두 참고자료가 충분한데 답변만 부정확하다면 **기존 Context + 평가 피드백으로 답변을 재생성**합니다.
- 최종 답변 생성 시에는 **원래 사용자 질문(`question`)**과 **선택된 Chunk 텍스트(`context`)**를 사용합니다.
