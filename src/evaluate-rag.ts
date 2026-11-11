
import {
    getEmbedding,
    cosineSimilarity
} from "./embedding.ts";

import { getDocuments } from "./vector-db.ts";

// 1. 평가 질문과 정답
const tests = [
    {
        question: "ABC 회사의 근무 시간은?",
        expected: "오전 9시부터 오후 6시까지"
    },
    {
        question: "ABC 회사의 데이터베이스는?",
        expected: "PostgreSQL"
    },
    {
        question: "ABC 회사의 개발팀 인원은?",
        expected: "10명"
    }
];

const K = 3;  //HITATk 값, 

// 2. SQLite에서 저장된 Chunk 가져오기, 나중에 이러한 부분이 쿼리나 뭐 이런걸로 해서 데이터의 실제 갯수룰 조회해서 가져오는 기능으로!
const documents = getDocuments();

async function evaluate() {
    let totalHit = 0;
    let totalRR = 0;

    for (const test of tests) {

        // 질문 Embedding
        const questionVector =
            await getEmbedding(test.question);

        // 유사도 계산 + 정렬
        const results = documents
            .map(doc => ({
                id: doc.id,
                content: doc.content,
                score: cosineSimilarity(
                    questionVector,
                    doc.embedding
                )
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, K);

        // 정답이 포함된 첫 Chunk의 위치
        const index = results.findIndex(doc =>
            doc.content.includes(test.expected)
        );

        // Hit@K 계산
        const hit = index === -1 ? 0 : 1;

        // RR 계산
        const rr = index === -1
            ? 0
            : 1 / (index + 1);

        totalHit += hit;
        totalRR += rr;

        console.log("\n질문:", test.question);
        console.log("Hit:", hit);
        console.log("RR:", rr.toFixed(4));
        console.log("정답 순위:",
            index === -1 ? "없음" : index + 1
        );
    }

    // 3. 전체 질문 평균
    const hitAtK = totalHit / tests.length;
    const mrrAtK = totalRR / tests.length;

    console.log("\n=== 최종 평가 ===");
    console.log(
        `Hit@${K}: ${hitAtK.toFixed(4)}`
    );
    console.log(
        `MRR@${K}: ${mrrAtK.toFixed(4)}`
    );
}

await evaluate();
