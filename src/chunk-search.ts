
import { getEmbedding, cosineSimilarity } from './embedding.ts';
import { getDocuments } from './vector-db.ts';

async function searchChunks(question: string) {
    // 1. 사용자 질문을 벡터로 변환
    const questionVector = await getEmbedding(question);

    // 2. DB에서 문서와 Chunk를 가져옴
    const documents = getDocuments();

    // 3. 유사도 계산
    const results = documents.map(doc => ({
        content: doc.content,
        score: cosineSimilarity(questionVector, doc.embedding),
    }));

    // 4. 유사도가 높은 순서로 정렬
    results.sort((a, b) => b.score - a.score);

    // 5. 상위 3개 반환
    return results.slice(0, 3);
}

const results = await searchChunks(
    'ABC 회사는 어떤 데이터베이스를 사용하나요?'
);

console.log('\n[검색 결과]');

results.forEach((result, index) => {
    console.log(`\n${index + 1}위`);
    console.log('유사도:', result.score.toFixed(4));
    console.log('내용:', result.content);
});
