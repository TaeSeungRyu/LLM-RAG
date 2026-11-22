import { getEmbedding } from "./embedding.ts";

const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(
    question: string
): Promise<number[]> {
    const cached = embeddingCache.get(question);

    if (cached !== undefined) {
        console.log("Embedding Cache HIT");
        return cached;
    }

    // 기존에 구현한 Embedding 함수
    const embedding = await getEmbedding(question);

    embeddingCache.set(question, embedding);

    return embedding;
}