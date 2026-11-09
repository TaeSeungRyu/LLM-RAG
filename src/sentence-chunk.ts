
import { readFileSync } from 'node:fs';
import { getEmbedding } from './embedding.ts';
import { saveDocument } from './vector-db.ts';

function splitBySentence(
    text: string,
    chunkSize: number,
    overlap = 1
): string[] {
    if (chunkSize <= 0 || overlap < 0) {
        throw new Error('잘못된 설정입니다.');
    }

    const sentences = text
        .split(/(?<=[.!?。！？])\s+|\r?\n+/)
        .map(s => s.trim())
        .filter(Boolean);

    const chunks: string[] = [];
    let start = 0;

    while (start < sentences.length) {
        let end = start;
        let current = '';

        // 문장을 하나씩 Chunk에 추가
        while (end < sentences.length) {
            const next = current
                ? `${current} ${sentences[end]}`
                : sentences[end];

            if (current && next.length > chunkSize) {
                break;
            }

            current = next;
            end++;
        }

        chunks.push(current);

        if (end >= sentences.length) break;

        // 이전 Chunk의 마지막 문장을 중복
        // 단, 다음 반복에서도 반드시 앞으로 이동
        start = Math.max(start + 1, end - overlap);
    }

    return chunks;
}

const text = readFileSync(
    './data/company.txt',
    'utf-8'
);

async function main() {
  const chunks = splitBySentence(text, 100, 1);

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);

    saveDocument(chunk, embedding);

    console.log('저장 완료:', chunk);
  }
}

main().catch(console.error);