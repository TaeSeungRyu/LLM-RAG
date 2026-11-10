
type SearchResult = {
    id: number;
    score: number;
};

// 질문 하나에 대한 RR 계산
function reciprocalRank(
    results: SearchResult[],
    correctIds: number[],
    k: number
): number {
    const topK = results.slice(0, k);

    // 첫 번째 정답의 위치 검색
    const index = topK.findIndex(result =>
        correctIds.includes(result.id)
    );

    // 정답이 없으면 0
    if (index === -1) {
        return 0;
    }

    // 배열은 0부터 시작하므로 +1
    return 1 / (index + 1);
}

const results: SearchResult[] = [
    { id: 10, score: 0.85 },
    { id: 20, score: 0.78 },
    { id: 30, score: 0.72 }
];

const correctIds = [30];

console.log(
    'RR:',
    reciprocalRank(results, correctIds, 3)
);



type TestCase = {
  question: string;
  correctIds: number[];
  results: SearchResult[];
};

const tests: TestCase[] = [
  {
    question: '근무 시간은?',
    correctIds: [3],
    results: [
      { id: 3, score: 0.81 },
      { id: 2, score: 0.65 }
    ]
  },
  {
    question: '사용하는 DB는?',
    correctIds: [5],
    results: [
      { id: 2, score: 0.78 },
      { id: 5, score: 0.72 }
    ]
  },
  {
    question: '주요 사업은?',
    correctIds: [1],
    results: [
      { id: 4, score: 0.75 },
      { id: 3, score: 0.69 }
    ]
  }
];

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

    console.log(test.question, '→ RR:', rr);
  }

  const mrr = total / tests.length;

  console.log(`MRR@${k}:`, mrr.toFixed(4));

  return mrr;
}

evaluateMRR(tests, 3);
//Hit@K: 검색 결과 상위 K개 안에 정답이 있는가? 
//MRR: 정답이 검색 결과에서 얼마나 높은 순위에 나타났는가?