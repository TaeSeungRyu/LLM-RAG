# RAG 학습 정리 — : Tokenizer · Caching

## Tokenizer 및 Token Budget 관리

**목적:** LLM이 처리하는 실제 토큰 수를 파악하여 Context Window를 초과하지 않도록 참고자료의 크기를 관리한다.

- **Tokenizer:** 문자열을 토큰 ID로 변환(`encode`)하고 다시 문자열로 복원(`decode`)하는 도구. 토큰 1개는 글자 1개와 같지 않다.
- **Context Window:** 모델이 한 요청에서 처리할 수 있는 토큰 범위(입력과 출력에 필요한 공간 고려).
- **Token Budget:** Context Window 중 검색된 Chunk에 할당할 토큰 예산.
- **주의:** JavaScript `text.length`는 UTF-16 코드 단위 수이며, 토큰 개수와 다르다. 모델과 호환되는 Tokenizer를 사용해야 한다.

### 핵심 코드 (개념)

```ts
const tokenCount = tokenizer.encode(text).length;

const selected: Chunk[] = [];
for (const chunk of reranked) {
  const next = [...selected, chunk];
  const context = next.map(x => `[문서 ${x.id}]\n${x.content}`).join("\n\n");
  if (tokenizer.encode(context).length > MAX_CONTEXT_TOKENS) continue;
  selected.push(chunk);
}
```

> `MAX_CONTEXT_TOKENS`는 **참고자료용** 예산이다. 시스템 프롬프트·질문·채팅 템플릿·답변 생성 공간도 별도로 고려한다.

### 로컬 실습

- 라이브러리: `@huggingface/tokenizers`
- 파일: Qwen3-1.7B의 `tokenizer.json`, `tokenizer_config.json` (Hugging Face에서 별도 다운로드)
- Ollama의 LLM을 실행하지 않고 Tokenizer만 사용해 토큰 수를 계산할 수 있다.
- Tokenizer가 반환하는 참고자료 토큰 수와 실제 Ollama 전체 요청 토큰 수는 특수 토큰·메시지 형식 때문에 다를 수 있다.

## RAG Caching (캐싱)

**목적:** 같은 연산을 반복하지 않고 이전 결과를 재사용하여 LLM 호출 수와 응답 지연을 줄인다.

| 캐시 종류 | 키 → 값 | 절감 대상 |
|---|---|---|
| Embedding Cache | 질문(+모델 버전) → 벡터 | 임베딩 생성 |
| Retrieval Cache | 질문(+인덱스 버전) → 검색 결과 | 벡터 검색 |
| Re-ranking Cache | 질문 + Chunk 내용/ID + 모델/프롬프트 버전 → 점수 | LLM 재평가 |
| Answer Cache | 질문 + 데이터/설정 버전 → 답변 | 전체 답변 생성 과정 |

### 핵심 코드 (개념)

```ts
const embeddingCache = new Map<string, number[]>();

async function cachedEmbedding(question: string) {
  const key = `${EMBEDDING_MODEL_VERSION}:${question}`;
  const cached = embeddingCache.get(key);
  if (cached !== undefined) return cached; // HIT

  const vector = await getEmbedding(question); // MISS
  embeddingCache.set(key, vector);
  return vector;
}
```

```ts
const rerankCache = new Map<string, number>();

async function cachedRerank(question: string, chunk: Chunk) {
  const key = JSON.stringify([question, chunk.id, chunk.content, RERANK_MODEL_VERSION, PROMPT_VERSION]);
  const cached = rerankCache.get(key);
  if (cached !== undefined) return cached;

  const score = await evaluateChunk(question, chunk.content);
  rerankCache.set(key, score);
  return score;
}
```

- **Cache HIT:** 저장된 결과 재사용 / **MISS:** 새로 계산하고 저장.
- **TTL:** 유효 기간 / **Invalidation:** 원본 문서·모델·프롬프트 변경 시 캐시 무효화.
- `Map`은 메모리 기반으로 프로세스 종료 시 사라진다. 다중 서버·영속 저장이 필요하면 Redis 등 고려.
- 질문 문자열이 조금만 달라도 일반적인 키 기반 캐시는 MISS가 발생한다. 유사 질문 재사용은 Semantic Cache 영역이다.
- 답변 캐시는 최신성·권한·사용자별 데이터 범위를 특히 주의한다.

## 두 기술의 차이

| 구분 | Token Budget | Caching |
|---|---|---|
| 핵심 질문 | LLM에 **얼마나** 전달할까? | **이미 계산한 결과**를 재사용할까? |
| 주된 효과 | 한도 준수, 메모리·처리량 관리 | 중복 연산 감소, 응답 속도 개선 |
| 적용 위치 | Re-ranking 후 Context 선택 | Embedding·검색·Re-ranking·답변 등 여러 단계 |

**전체 흐름:** 질문 → (캐시 활용) Embedding → 검색 → (캐시 활용) Re-ranking → Token Budget에 맞춰 Chunk 선택 → LLM 답변 생성.
