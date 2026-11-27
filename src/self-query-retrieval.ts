
interface Chunk {
    id: string;
    content: string;
    metadata: {
        year: number;
        department: string;
    };
    score: number;
}

const documents: Chunk[] = [
    {
        id: "A",
        content: "2024년 직원 식대 지원",
        metadata: { year: 2024, department: "인사팀" },
        score: 0.95,
    },
    {
        id: "B",
        content: "2025년 직원 식대 지원",
        metadata: { year: 2025, department: "인사팀" },
        score: 0.92,
    },
    {
        id: "C",
        content: "2026년 직원 식대 20만 원 지원",
        metadata: { year: 2026, department: "인사팀" },
        score: 0.90,
    },
    {
        id: "D",
        content: "2026년 서버 구축 비용 지원",
        metadata: { year: 2026, department: "개발팀" },
        score: 0.50,
    },
    {
        id: "E",
        content: "2026년 직원 건강검진 지원",
        metadata: { year: 2026, department: "인사팀" },
        score: 0.85,
    },
];

const question = "2026년 인사팀의 복지제도를 알려줘.";

// 1. LLM 질문 분석 결과 (Mock)
const selfQuery = {
    query: "복지제도",
    filters: {
        year: 2026,
        department: "인사팀",
    },
};

// 2. Metadata Filtering
const filtered = documents.filter(doc => {
    return (
        doc.metadata.year === selfQuery.filters.year &&
        doc.metadata.department === selfQuery.filters.department
    );
});

// 3. Vector Search 결과 정렬 (Mock)
const ranked = filtered.sort(
    (a, b) => b.score - a.score
);

// 4. Top-K
const topK = ranked.slice(0, 3);

console.table(topK);

// 5. Context 구성
const context = topK
    .map(doc => doc.content)
    .join("\n");

// 6. 최종 LLM 프롬프트
const prompt = `
참고자료:
${context}

질문:
${question}

참고자료를 기반으로 답변하세요.
`;

console.log(prompt);

//실제 Vector DB에 저장되는 데이터 샘플
//Metadata도 함께 저장
const document = {
  id: "C",
  content: "직원 식대 20만 원 지원",
  embedding: [0.82, 0.45, 0.71],
  metadata: {
    year: 2026,
    department: "인사팀",
    category: "복지",
  },
};