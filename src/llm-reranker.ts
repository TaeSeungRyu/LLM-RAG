
import {
    getEmbedding,
    cosineSimilarity,
} from "./embedding.ts";

import { getDocuments } from "./vector-db.ts";

type SearchResult = {
    id: number;
    content: string;
    score: number;
};

type RerankedResult = SearchResult & {
    rerankScore: number;
};

const OLLAMA_URL = "http://localhost:11434";

const QUESTION = "ABC 회사의 근무 시간은?";

const CANDIDATE_K = 5;
const FINAL_K = 3;

// 1. Embedding 기반 검색
async function searchDocuments(
    question: string,
    k: number
): Promise<SearchResult[]> {
    const documents = getDocuments();

    const questionVector = await getEmbedding(question);

    return documents
        .map((doc) => ({
            id: doc.id,
            content: doc.content,
            score: cosineSimilarity(
                questionVector,
                doc.embedding
            ),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}

// 2. Ollama에 질문과 Chunk를 전달하여 관련성 평가
async function evaluateRelevance(
    question: string,
    content: string
): Promise<number> {
    const response = await fetch(
        `${OLLAMA_URL}/api/chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "qwen3:1.7b",
                stream: false,
                format: "json",
                options: {
                    temperature: 0,
                },
                messages: [
                    {
                        role: "system",
                        content: `
당신은 RAG 검색 결과 평가자입니다.

사용자 질문과 문서의 관련성을 평가하세요.

0부터 10까지 점수를 부여하세요.

0 = 전혀 관련 없음
5 = 일부 관련 있음
10 = 질문에 직접 답할 수 있음

반드시 다음 JSON 형식으로만 응답하세요.

{"score": 0}
            `.trim(),
                    },
                    {
                        role: "user",
                        content: `
질문:
${question}

문서:
${content}
            `.trim(),
                    },
                ],
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Ollama API 오류: ${response.status}`
        );
    }

    const data = await response.json();

    const raw = JSON.parse(data.message.content);

    const score = Number(raw.score);

    if (!Number.isFinite(score)) {
        throw new Error("유효하지 않은 관련성 점수");
    }

    return Math.max(0, Math.min(10, score));
}

// 3. 검색된 Chunk 재정렬
async function rerankDocuments(
    question: string,
    results: SearchResult[]
): Promise<RerankedResult[]> {
    const reranked: RerankedResult[] = [];

    for (const doc of results) {
        const rerankScore = await evaluateRelevance(
            question,
            doc.content
        );

        reranked.push({
            ...doc,
            rerankScore,
        });
    }

    return reranked.sort(
        (a, b) => b.rerankScore - a.rerankScore
    );
}

// 4. 전체 실행
async function main(): Promise<void> {
    console.log(`질문: ${QUESTION}`);

    const candidates = await searchDocuments(
        QUESTION,
        CANDIDATE_K
    );

    console.log("\n===== 기존 검색 순위 =====");

    console.table(
        candidates.map((doc, index) => ({
            rank: index + 1,
            id: doc.id,
            similarity: doc.score.toFixed(4),
            content: doc.content,
        }))
    );

    const reranked = await rerankDocuments(
        QUESTION,
        candidates
    );

    console.log("\n===== Re-ranking 결과 =====");

    console.table(
        reranked.map((doc, index) => ({
            rank: index + 1,
            id: doc.id,
            similarity: doc.score.toFixed(4),
            rerankScore: doc.rerankScore,
            content: doc.content,
        }))
    );

    const finalResults = reranked.slice(0, FINAL_K);

    console.log("\n===== 최종 선택된 Chunk =====");

    console.table(
        finalResults.map((doc, index) => ({
            rank: index + 1,
            id: doc.id,
            rerankScore: doc.rerankScore,
            content: doc.content,
        }))
    );
}

main().catch(console.error);
