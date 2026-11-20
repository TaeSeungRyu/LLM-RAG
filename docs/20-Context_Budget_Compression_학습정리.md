# RAG 학습 정리 

> 범위: Corrective RAG 이후 학습한 **Context Budget 관리**와 **Context Compression**

## Context Budget 관리

**개념:** LLM에 전달할 참고자료(Context)의 양을 제한하고, 예산 안에서 필요한 Chunk를 선택하는 방법.

**필요한 이유**
- LLM의 **Context Window(토큰 한도)** 초과 방지
- 로컬 LLM의 **RAM/VRAM 사용량과 처리 지연** 관리
- 불필요한 자료를 줄여 답변 집중도 개선; 외부 API 사용 시 비용 절감

**현재 학습 코드:** Re-ranking 결과를 순회하며 `content.length`를 누적하고, `MAX_CONTEXT_CHARS`를 초과하는 Chunk는 `continue`로 건너뜀. `FINAL_K`로 개수도 제한.

```ts
let usedChars = 0;
const selected = [];
for (const chunk of reranked) {
  if (selected.length >= FINAL_K) break;
  const length = chunk.content.length; // 학습용: 문자 길이
  if (usedChars + length > MAX_CONTEXT_CHARS) continue;
  selected.push(chunk);
  usedChars += length;
}
```

**주의:** `string.length`는 JavaScript의 UTF-16 코드 단위 길이이며 **토큰 수와 다름**. 실무에서는 모델에 맞는 Tokenizer로 시스템 프롬프트·질문·문서 ID·구분자·출력 여유분까지 고려해 토큰 예산을 관리함. Ollama의 `num_ctx`는 전체 Context Window 설정이며, 애플리케이션의 참고자료 예산과 구분해야 함.

## Context Compression

**개념:** 검색된 Chunk를 무조건 제외하지 않고, 질문에 필요한 문장만 추출하거나 내용을 요약해 Context 크기를 줄이는 방법.

**주요 방식**
- **Extractive:** 관련 문장만 추출해 원문 표현 유지
- **Abstractive:** LLM이 핵심 내용을 새 문장으로 요약
- **Filtering:** 관련성 낮은 Chunk 자체를 제외

**개념 코드 (문장 추출):**

```ts
const compressed = chunk.content
  .split(/(?<=[.!?])\s+/)
  .filter(sentence => isRelevant(question, sentence))
  .join(" ");
// isRelevant: 키워드 비교 또는 의미 기반 평가 함수(개념)
```

**주의:** 압축 과정에서 부정 표현, 예외, 수치, 조건이 사라지면 오답이 발생할 수 있음. 압축 후에도 **Context Sufficiency(근거 충분성)**를 확인하고, 필요하면 원본 Chunk를 참고.

## 두 기술의 차이와 적용 흐름

| 구분 | Context Budget | Context Compression |
|---|---|---|
| 핵심 질문 | 얼마나 넣을 수 있는가? | 어떻게 줄이면서 근거를 남길까? |
| 처리 | 개수·길이·토큰 예산에 맞춰 선택 | 문장 추출·요약·필터링 |
| 위험 | 필요한 Chunk가 통째로 빠짐 | 중요한 조건이나 근거가 손실됨 |

```text
Vector DB 검색 → Re-ranking → Context Compression
                                  ↓
                         Context Budget 확인
                                  ↓
                         Chunk 선택 → 답변 생성
```

**한 줄 요약:** Budget은 **전달량을 제한**하고, Compression은 **정보를 압축**한다. 둘 다 Context Window를 효율적으로 사용하기 위한 방법이다.

**다음 예정 학습:** **Tokenizer와 토큰 기반 Context Budget 관리** (Ollama 연동 반복 없이 핵심 개념·로직 중심).
