
import { readFileSync } from 'node:fs';

function splitBySentence(
    text: string,
    chunkSize: number
): string[] {

    // 1. 줄바꿈과 문장 끝을 기준으로 분할
    const sentences = text
        .split(/(?<=[.!?。！？])\s+|\r?\n+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);

    const chunks: string[] = [];
    let currentChunk = '';

    // 2. 문장을 하나씩 확인
    for (const sentence of sentences) {

        const combined = currentChunk
            ? `${currentChunk} ${sentence}`
            : sentence;

        // 3. Chunk 크기를 초과하면 기존 Chunk 저장
        if (
            currentChunk &&
            combined.length > chunkSize
        ) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk = combined;
        }
    }

    // 4. 마지막 Chunk 저장
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

const text = readFileSync(
    './data/company.txt',
    'utf-8'
);

const chunks = splitBySentence(text, 100);

chunks.forEach((chunk, index) => {
    console.log(`\n[Chunk ${index + 1}]`);
    console.log(chunk);
    console.log(`길이: ${chunk.length}`);
});
