
import { readFileSync } from 'node:fs';
import { saveDocument, getDocuments } from './vector-db.ts';
import { getEmbedding } from './embedding.ts';

/***
 * 
 *  Chunking의 목적.
 *  1. 검색 정확도 개선 — 질문과 관련된 부분을 더 잘 찾기 위해
 *  2. LLM 입력량 감소 — 긴 문서 전체가 아닌 필요한 부분만 전달하기 위해
 *  3. 문맥 유지 — 적절한 크기와 Overlap으로 의미가 끊기지 않도록 하기 위해
 */
// 문자열을 일정한 크기로 분할
export function splitText(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  if (
    !Number.isInteger(chunkSize) ||
    !Number.isInteger(overlap) ||
    chunkSize <= 0 ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new Error('Chunk Size 또는 Overlap이 올바르지 않습니다.');
  }

  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < text.length; start += step) {
    const chunk = text.slice(start, start + chunkSize).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= text.length) {
      break;
    }
  }

  return chunks;
}

//Chunking = 문서를 나누는 것
//Overlap = 나눌 때 일부 내용을 겹치게 하여 문맥을 보존하는 것
async function main() {
  const text = readFileSync('./data/company.txt', 'utf-8');

  const chunks = splitText(text, 100, 20);
  const savedContents = new Set(
    getDocuments().map(doc => doc.content)
  );

  console.log(`전체 Chunk 수: ${chunks.length}`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // 이미 저장된 Chunk는 다시 Embedding하지 않음
    if (savedContents.has(chunk)) {
      console.log(`Chunk ${i + 1}: 이미 저장됨`);
      continue;
    }

    const embedding = await getEmbedding(chunk);

    saveDocument(chunk, embedding);
    savedContents.add(chunk);

    console.log(`Chunk ${i + 1}: DB 저장 완료`);
  }

  console.log('\n모든 Chunk 저장 완료!');
}

await main();
