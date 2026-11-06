//코사인 유사도(Cosine Similarity)
//두 벡터가 이루는 각도를 이용해 유사도를 계산

const URL = 'http://localhost:11434/api/embed';
const MODEL = 'embeddinggemma';

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


async function main() {
    const sentences = [
        '나는 개발자입니다.',
        '저는 프로그래밍을 하는 사람입니다.',
        '오늘 점심은 김치찌개입니다.',
    ];

    const vectors: number[][] = [];

    for (const sentence of sentences) {
        const vector = await getEmbedding(sentence);
        vectors.push(vector);
    }
    console.log(
        'A ↔ B:',
        cosineSimilarity(vectors[0], vectors[1]).toFixed(4)
    );

    console.log(
        'A ↔ C:',
        cosineSimilarity(vectors[0], vectors[2]).toFixed(4)
    );
}


//유사도 체크용
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
        throw new Error('영벡터의 유사도는 계산할 수 없습니다.');
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


main().catch(console.error);
