# RAG --- RRF (Reciprocal Rank Fusion)

## 1. 개념 및 목적

RRF는 서로 다른 검색 결과의 **점수가 아닌 순위**를 이용해 하나의 최종
순위를 만드는 알고리즘이다. Vector Search의 Cosine Similarity와 BM25의
점수는 척도가 다르므로 직접 합산하기 어렵다.

## 2. 계산 공식

`RRF(d) = Σ 1 / (k + rank(d))`

-   rank: 각 검색 목록에서의 순위 (1부터 시작)
-   k: 순위 차이를 완화하는 상수 (일반적으로 60)
-   검색 목록에 없는 문서는 해당 목록에서 0점
-   동일 문서의 점수를 합산하고 내림차순 정렬

  문서     Vector 순위   BM25 순위   RRF 점수 (k=60) 최종 순위
  ------ ------------- ----------- ----------------- -----------
  A                  1           3           0.03227 공동 1위
  C                  3           1           0.03227 공동 1위
  B                  2        없음           0.01613 공동 3위
  D               없음           2           0.01613 공동 3위

문서 A: `1/61 + 1/63 ≈ 0.03227`

여러 검색 목록에서 발견된 문서가 유리하지만, 반드시 실제 관련성이 높다는
의미는 아니다.

## 3. TypeScript 핵심 코드

``` typescript
const vectorResults = ['A', 'B', 'C'];
const bm25Results = ['C', 'D', 'A'];
const scores = new Map<string, number>();
const k = 60;

for (const results of [vectorResults, bm25Results]) {
  results.forEach((id, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    scores.set(id, (scores.get(id) ?? 0) + score);
  });
}

const ranked = [...scores.entries()]
  .sort((a, b) => b[1] - a[1]);

console.table(ranked);
```

각 검색 목록은 순위순으로 정렬되어 있고 문서 ID가 중복되지 않는다고
가정한다. 동점 처리 기준은 필요에 따라 별도로 정한다.

## 4. 상수 k의 역할

  k      특징
  ------ -----------------------------------------------
  작음   상위 순위의 영향력이 커짐
  큼     순위별 점수 차이가 줄어듦
  60     일반적인 기본값 (최적값은 데이터에 따라 다름)

RRF의 k는 Top-K의 K(검색 결과 개수)와 다른 개념이다.

## 5. RRF와 Re-ranking 비교

  구분             RRF                   Re-ranking
  ---------------- --------------------- ------------------------------
  목적             여러 검색 결과 통합   문서 관련성 재평가
  기준             기존 검색 순위        질문과 문서의 관련성
  문서 내용 분석   없음                  일반적으로 수행
  LLM 호출         불필요                LLM 또는 별도 모델 활용 가능

## 6. RAG 적용 흐름

``` text
사용자 질문
    ↓
Vector Search + BM25 Search (Hybrid Search)
    ↓
RRF (순위 결합 및 중복 통합)
    ↓
Re-ranking (선택적 관련성 재평가)
    ↓
Top-K → Context 구성 → LLM 답변
```

## 7. 면접 대비 핵심 요약

  용어            한 줄 설명
  --------------- --------------------------------
  Vector Search   의미 기반 검색
  BM25            키워드 기반 검색
  Hybrid Search   두 검색 방식 결합
  RRF             검색 순위를 기반으로 결과 통합
  Re-ranking      질문과 문서의 관련성 재평가

**면접 답변:** RRF는 서로 다른 검색 방식의 점수 척도 문제를 해결하기
위해 점수 대신 순위를 활용하여 검색 결과를 통합하는 알고리즘입니다.
Hybrid Search에서 Vector Search와 BM25 결과를 결합할 때 사용할 수
있으며, 별도의 LLM 호출이 필요하지 않습니다.

다음 학습: 38일 차 --- Multi-Query Retrieval
