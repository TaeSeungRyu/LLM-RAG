import { getDocuments } from './vector-db.ts';

//////1. 모델 및 DB 연결//////
const EMBEDDING_MODEL = 'embeddinggemma';
const EMBEDDING_URL = 'http://localhost:11434/api/embed';
const LLM_MODEL = 'qwen3:1.7b';
const LLM_URL = 'http://localhost:11434/api/chat';

///// A-1 : 임계값 설정을 위한 상수(임계값은 기준 수치를 활용하여 불필요한 답변을 하지 않도록 하는 것!)
const SIMILARITY_THRESHOLD = 0.6;
const TOP_K = 3;


//////2. 질문을 Embedding으로 변환 //////
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(EMBEDDING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.embeddings[0];
}


//////3. DB에서 관련 문서 검색//////
function    cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error('벡터 차원이 일치하지 않습니다.');
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

//////4. 검색 함수//////

async function searchDocuments(question: string) {
  const queryVector = await getEmbedding(question);
  const documents = getDocuments();

  const results = documents.map(doc => ({
    content: doc.content,
    score: cosineSimilarity(queryVector, doc.embedding),
  }));

  // 유사도가 높은 순서로 정렬
  results.sort((a, b) => b.score - a.score);

  // 기준 이상의 문서만 반환
  return results
    .filter(doc => doc.score >= SIMILARITY_THRESHOLD)   //임계값을 적용, 벡터값 일정 수치 이하를 모델에게 전달을 하지 않도록 함.
    .slice(0, TOP_K);
}



//////5. 검색 결과를 LLM에 전달//////

async function askRAG(question: string) {
  // 1. 관련 문서 검색
  const documents = await searchDocuments(question);

  // 검색 결과가 없는 경우
  if (documents.length === 0) {
    console.log('\n[AI 답변]');
    console.log('관련 자료가 없어 답변할 수 없습니다.');
    return;
  }

  // 2. 검색된 문서를 하나의 문자열로 구성
  const context = documents
    .map(doc => doc.content)
    .join('\n');

  console.log('\n[검색된 문서]');
  for (const doc of documents) {
    console.log(doc.score.toFixed(4), doc.content);
  }

  // 3. LLM 호출
  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      stream: false,
      think: false,
      messages: [
        {
          role: 'system',
          content:
            '당신은 친절한 AI 비서입니다. ' +
            '제공된 참고 자료만 근거로 답변하세요. ' +
            '자료에 없는 내용은 모른다고 답하세요.',
        },
        {
          role: 'user',
          content:
            `참고 자료:\n${context}\n\n` +
            `질문: ${question}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}`);
  }

  const data = await response.json();

  console.log('\n[AI 답변]');
  console.log(data.message.content);
}

async function main() {
  //await askRAG('나는 어떤 언어로 서버를 개발하지?');
  await askRAG('나는 배가 너무 고파!');  //임계값 적용 테스트
}

main().catch(console.error);


//프로세스 정리 요약
//사용자 질문 → 벡터화 → DB 유사도 검색 → 관련 원문 추출 → 원문 + 질문을 LLM에 전달 → 최종 답변