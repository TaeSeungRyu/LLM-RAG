
import { getEmbedding, cosineSimilarity } from "./embedding.ts";
import { getDocuments } from "./vector-db.ts";

// 기존 테스트 데이터 유지
const tests: { question: string; expected: string }[] = [
    {
        question: "ABC 회사의 근무 시간은?",
        expected: "오전 9시부터 오후 6시까지",
    },
    {
        question: "ABC 회사의 데이터베이스는?",
        expected: "PostgreSQL",
    },
    {
        question: "ABC 회사의 개발팀 인원은?",
        expected: "10명",
    },
];

const K = 3;

async function main(): Promise<void> {
    const documents = getDocuments();

    let totalHit = 0;
    let totalRR = 0;
    let totalPrecision = 0;

    for (const test of tests) {
        const questionVector = await getEmbedding(test.question);

        // 1. 유사도 계산 및 상위 K개 검색
        const results = documents
            .map((doc) => ({
                id: doc.id,
                content: doc.content,
                score: cosineSimilarity(
                    questionVector,
                    doc.embedding
                ),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, K);

        // 2. 정답 Chunk 판별
        const relevantResults = results.filter((doc) =>
            doc.content.includes(test.expected)
        );

        // 3. Hit@K
        const hit = relevantResults.length > 0 ? 1 : 0;

        // 4. RR
        const firstIndex = results.findIndex((doc) =>
            doc.content.includes(test.expected)
        );

        const rr =
            firstIndex === -1 ? 0 : 1 / (firstIndex + 1);

        // 5. Precision@K (오늘 추가한 부분)
        const precision = relevantResults.length / K;

        totalHit += hit;
        totalRR += rr;
        totalPrecision += precision;

        console.log(`\n질문: ${test.question}`);

        console.table(
            results.map((doc, index) => ({
                rank: index + 1,
                id: doc.id,
                score: doc.score.toFixed(4),
                relevant: doc.content.includes(test.expected),
                content: doc.content,
            }))
        );

        console.log(`Hit@${K}: ${hit}`);
        console.log(`RR@${K}: ${rr.toFixed(4)}`);
        console.log(
            `Precision@${K}: ${precision.toFixed(4)}`
        );
    }

    // 6. 전체 질문 평균
    console.log("\n===== 최종 평가 결과 =====");

    console.log(
        `Hit@${K}: ${(totalHit / tests.length).toFixed(4)}`
    );

    console.log(
        `MRR@${K}: ${(totalRR / tests.length).toFixed(4)}`
    );

    console.log(
        `Mean Precision@${K}: ${(totalPrecision / tests.length).toFixed(4)}`
    );
}

main().catch(console.error);
