# Chunk 기반 RAG

## 1. 개념

Chunk 기반 RAG는 문서를 작은 단위(Chunk)로 나누어 저장하고, 사용자 질문과 관련된 Chunk를 검색하여 LLM에 전달하는 방식이다.

**Semantic Search는 문서를 찾고, LLM은 검색된 문서를 참고하여 답변을 생성한다.**

## 2. 목적

- 긴 문서에서 질문과 관련된 내용만 검색
- 불필요한 정보를 줄여 LLM에 전달
- 회사 내부 문서처럼 LLM이 모르는 정보에 기반한 답변 생성
- 근거 없는 답변을 줄이는 데 도움

## 3. 동작 과정

### 문서 등록

```text
company.txt
    ↓
Chunking + Overlap
    ↓
embeddinggemma (벡터 변환)
    ↓
SQLite (Chunk 원문 + 벡터 저장)
```

### 질문 및 답변

```text
사용자 질문
    ↓
embeddinggemma (질문 벡터 생성)
    ↓
SQLite에 저장된 벡터와 비교
    ↓
Cosine Similarity
    ↓
Threshold 필터링
    ↓
Top-K 선택
    ↓
관련 Chunk 원문 추출
    ↓
Chunk 원문 + 질문 → qwen3:1.7b
    ↓
최종 답변 생성
```

## 4. Threshold 실습

질문에 대한 실제 검색 결과:

| 순위 | 유사도 |
|---|---|
| 1위 | 0.5873 |
| 2위 | 0.4608 |
| 3위 | 0.3925 |

Threshold가 `0.6`일 때는 모든 Chunk가 제외되었다.

```typescript
const THRESHOLD = 0.6;
```

`0.5`로 변경하니 1위 Chunk가 통과하여 LLM에 전달되었다.

```typescript
const THRESHOLD = 0.5;
const TOP_K = 3;
```

**0.5는 절대적인 정답이 아니다.** Embedding 모델, 문서 내용, Chunk 크기에 따라 적절한 Threshold가 달라진다.

실무에서는 다양한 질문의 검색 결과와 실제 관련성을 확인하여 조정한다.

## 5. 실습에서 배운 점

- `embeddinggemma`는 벡터를 생성하며 답변을 만들지 않는다.
- `cosineSimilarity()`는 질문과 문서 벡터의 유사도를 계산한다.
- `Threshold`는 관련성이 낮은 문서를 제외하는 기준이다.
- `Top-K`는 반환할 문서의 최대 개수다.
- LLM에는 벡터가 아닌 **검색된 Chunk의 원문**을 전달한다.
- 관련 Chunk가 검색되지 않으면 LLM 호출을 생략할 수 있다.
- Threshold가 지나치게 높으면 실제로 관련된 문서도 제외될 수 있다.

## 6. 핵심 요약

> Chunking은 검색할 문서를 준비하고, Embedding은 의미 비교를 가능하게 하며, Semantic Search는 관련 Chunk를 찾는다. RAG는 그 Chunk를 LLM에 전달하여 자연어 답변을 생성한다.

**다음 학습:** 글자 수 기준 Chunking을 문장·문단 기준 Chunking으로 개선하기.