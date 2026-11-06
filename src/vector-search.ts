
import {
    saveDocument,
    getDocuments,
} from './vector-db.ts';

const URL = 'http://localhost:11434/api/embed';
const MODEL = 'embeddinggemma';

const documents = [
    '나는 TypeScript로 서버를 개발합니다.',
    '나는 인천에 거주합니다.',
    '나는 주말마다 축구를 합니다.',
    '나는 PostgreSQL 데이터베이스를 사용합니다.',
    '나는 React로 웹 프론트엔드를 개발합니다.',
];

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

// 문서를 최초 1회만 Embedding하여 저장
async function initializeDocuments() {
    const savedContents = new Set(
        getDocuments().map(doc => doc.content)
    );

    for (const content of documents) {
        if (savedContents.has(content)) {
            console.log('이미 저장됨:', content);
            continue;
        }

        const embedding = await getEmbedding(content);
        saveDocument(content, embedding);

        console.log('새 문서 저장:', content);
    }
}

// DB에 저장된 벡터로 검색
async function search(query: string) {
    const queryVector = await getEmbedding(query);
    const savedDocuments = getDocuments();

    const results = savedDocuments.map(doc => ({
        content: doc.content,
        score: cosineSimilarity(queryVector, doc.embedding),
    }));

    results.sort((a, b) => b.score - a.score);

    return results;
}

async function main() {
    await initializeDocuments();

    const question = '어떤 언어로 서버를 개발해?';
    const results = await search(question);

    console.log('\n질문:', question);
    console.log('\n검색 결과 TOP 3');

    for (const result of results.slice(0, 3)) {
        console.log(
            result.score.toFixed(4),
            result.content
        );
    }
}

main().catch(console.error);
