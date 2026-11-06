
const URL = 'http://localhost:11434/api/embed';
const MODEL = 'embeddinggemma';

// 검색 대상 문서
const documents = [
  '나는 TypeScript로 서버를 개발합니다.',
  '나는 인천에 거주합니다.',
  '나는 주말마다 축구를 합니다.',
  '나는 PostgreSQL 데이터베이스를 사용합니다.',
  '나는 React로 웹 프론트엔드를 개발합니다.',
];

// Embedding 생성
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.embeddings[0];
}

// 코사인 유사도
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error('벡터 차원이 올바르지 않습니다.');
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  if (normA === 0 || normB === 0) {
    throw new Error('영벡터는 비교할 수 없습니다.');
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 의미 기반 검색
async function search(query: string) {
  const queryVector = await getEmbedding(query);

  const results = [];

  for (const document of documents) {
    const documentVector = await getEmbedding(document);

    const score = cosineSimilarity(
      queryVector,
      documentVector
    );

    results.push({
      document,
      score,
    });
  }

  // 유사도가 높은 순서로 정렬
  results.sort((a, b) => b.score - a.score);

  return results;
}

async function main() {
  //const question = '어떤 프로그래밍 언어로 백엔드를 개발해?';
  const question = '어디에 살고 있어?';
  const results = await search(question);

  console.log('질문:', question);
  console.log('\n검색 결과:');

  for (const result of results) {
    console.log(
      result.score.toFixed(4),
      result.document
    );
  }
}

main().catch(console.error);
