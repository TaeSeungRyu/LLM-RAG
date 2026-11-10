
type SearchResult = {
    id: number;
    score: number;
};

// 검색 결과는 유사도 내림차순으로 정렬되어 있다고 가정
function hitAtK(
    results: SearchResult[],
    correctIds: number[],
    k: number
): number {
    const topK = results.slice(0, k);
    const found = topK.some(result =>
        correctIds.includes(result.id)
    );
    return found ? 1 : 0;
}

// const results: SearchResult[] = [
//     { id: 10, score: 0.85 },
//     { id: 20, score: 0.78 },
//     { id: 30, score: 0.72 },
//     { id: 40, score: 0.65 }
// ];

// // 정답이 들어 있는 문서 ID
// const correctIds = [30];

// console.log('Hit@1:', hitAtK(results, correctIds, 1));
// console.log('Hit@2:', hitAtK(results, correctIds, 2));
// console.log('Hit@3:', hitAtK(results, correctIds, 3));


type TestCase = {
  question: string;
  correctIds: number[];
  results: SearchResult[];
};

const tests: TestCase[] = [
  {
    question: '회사의 근무 시간은?',
    correctIds: [3],
    results: [
      { id: 3, score: 0.81 },
      { id: 2, score: 0.65 },
      { id: 1, score: 0.53 }
    ]
  },
  {
    question: '회사는 어떤 DB를 사용하나요?',
    correctIds: [5],
    results: [
      { id: 2, score: 0.78 },
      { id: 5, score: 0.72 },
      { id: 3, score: 0.60 }
    ]
  },
  {
    question: '회사의 주요 사업은?',
    correctIds: [1],
    results: [
      { id: 4, score: 0.75 },
      { id: 3, score: 0.69 },
      { id: 2, score: 0.62 }
    ]
  }
];

function evaluate(tests: TestCase[], k: number) {
  let hits = 0;

  for (const test of tests) {
    const hit = hitAtK(
      test.results,
      test.correctIds,
      k
    );

    hits += hit;

    console.log(test.question, '→', hit);
  }

  const average = hits / tests.length;

  console.log(`Hit@${k}:`, average.toFixed(4));
}

evaluate(tests, 3);
