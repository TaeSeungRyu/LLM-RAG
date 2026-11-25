
interface Chunk {
    id: string;
    content: string;
}

const question = "ABC 회사의 복지제도는?";

// 1. LLM 질문 확장 결과 (하드코딩)
const queries = [
    question,
    "ABC 회사의 직원 복리후생은?",
    "ABC 회사의 직원 지원 제도는?",
    "ABC 회사의 근무 환경 혜택은?",
];

// 2. Vector DB 검색 결과 (하드코딩)
const documents: Record<string, Chunk> = {
    A: { id: "A", content: "매월 식대를 지급합니다." },
    B: { id: "B", content: "건강검진 비용을 지원합니다." },
    C: { id: "C", content: "자녀 학자금을 지원합니다." },
    D: { id: "D", content: "유연근무제를 운영합니다." },
};

const searchResults: Record<string, Chunk[]> = {
    [queries[0]]: [documents.A, documents.B],
    [queries[1]]: [documents.A, documents.B],
    [queries[2]]: [documents.B, documents.C],
    [queries[3]]: [documents.A, documents.D],
};

// 3. 각 질문으로 검색 및 결과 병합
const merged = new Map<string, Chunk>();

for (const query of queries) {
    const results = searchResults[query];

    console.log("검색 질문:", query);
    console.log("검색 결과:", results.map(chunk => chunk.id));

    // Chunk ID를 기준으로 중복 제거
    for (const chunk of results) {
        merged.set(chunk.id, chunk);
    }
}

// 4. 최종 검색 후보
const candidates = [...merged.values()];

console.log("\n최종 검색 후보");
console.table(candidates);

// 5. Context 구성
const context = candidates
    .map(chunk => chunk.content)
    .join("\n");

// 6. 최종 LLM Prompt 구성
const prompt = `
참고자료:
${context}

질문:
${question}

참고자료를 기반으로 답변하세요.
`;

console.log(prompt);
