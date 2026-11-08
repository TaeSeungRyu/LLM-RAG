
import { readFileSync } from 'node:fs';
/***
 * 
 *  Chunking의 목적.
 *  1. 검색 정확도 개선 — 질문과 관련된 부분을 더 잘 찾기 위해
 *  2. LLM 입력량 감소 — 긴 문서 전체가 아닌 필요한 부분만 전달하기 위해
 *  3. 문맥 유지 — 적절한 크기와 Overlap으로 의미가 끊기지 않도록 하기 위해
 */
// 문자열을 일정한 크기로 분할
function splitText(
    text: string,
    chunkSize: number,
    overlap: number
): string[] {
    if (
        chunkSize <= 0 ||
        overlap < 0 ||
        overlap >= chunkSize
    ) {
        throw new Error('Chunk Size 또는 Overlap이 올바르지 않습니다.');
    }

    const chunks: string[] = [];
    const step = chunkSize - overlap;

    for (let start = 0; start < text.length; start += step) {
        const chunk = text.slice(start, start + chunkSize);

        if (chunk.trim()) {
            chunks.push(chunk);
        }

        if (start + chunkSize >= text.length) {
            break;
        }
    }

    return chunks;
}

const text = readFileSync('./data/company.txt', 'utf-8');

//Chunking = 문서를 나누는 것
//Overlap = 나눌 때 일부 내용을 겹치게 하여 문맥을 보존하는 것

const chunks = splitText(text, 100, 20);

console.log('전체 Chunk 수:', chunks.length);

chunks.forEach((chunk, index) => {
    console.log(`\n[Chunk ${index + 1}]`);
    console.log(chunk);
});
