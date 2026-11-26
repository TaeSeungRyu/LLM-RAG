
interface Chunk {
    id: string;
    content: string;
}

const question = "ABC 회사의 복지제도는?";

// 1. LLM이 생성한 가상의 답변 (Mock)
function generateHypotheticalDocument(
    question: string
): string {
    return `
    ABC 회사는 직원들에게 식대 지원,
    건강검진, 자녀 학자금,
    유연근무제 등을 제공하고 있습니다.
  `.trim();
}

// 2. Embedding (Mock)
function embedding(text: string): number[] {
    return [0.82, 0.41, 0.65];
}

// 3. Vector Search (Mock)
function vectorSearch(vector: number[]): Chunk[] {
    return [
        {
            id: "A",
            content: "매월 식대 20만 원을 지급합니다.",
        },
        {
            id: "B",
            content: "건강검진 비용을 지원합니다.",
        },
        {
            id: "C",
            content: "자녀 학자금을 지원합니다.",
        },
    ];
}

// 4. HyDE 실행
const hypotheticalDoc =
    generateHypotheticalDocument(question);

const vector = embedding(hypotheticalDoc);

const results = vectorSearch(vector);

// 5. 실제 검색 결과로 Context 구성
const context = results
    .map(chunk => chunk.content)
    .join("\n");

// 6. 최종 LLM 프롬프트
const prompt = `
참고자료:
${context}

질문:
${question}

참고자료를 기반으로 답변하세요.
`;

console.log("가상 문서:", hypotheticalDoc);
console.log("검색 결과:", results);
console.log("최종 프롬프트:", prompt);
