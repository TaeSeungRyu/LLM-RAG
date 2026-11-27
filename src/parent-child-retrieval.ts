interface Parent {
    id: string;
    content: string;
}

interface Child {
    id: string;
    parentId: string;
    content: string;
}

const parents: Parent[] = [
    {
        id: "P1",
        content: `
      정규직 직원에게 매월 식대 20만 원을 지급합니다.
      수습 기간에는 10만 원을 지급합니다.
      계약직은 별도의 계약 조건을 따릅니다.
    `.trim(),
    },
    {
        id: "P2",
        content: `
      직원에게 연간 건강검진 비용을 지원합니다.
      배우자의 건강검진 비용도 일부 지원합니다.
    `.trim(),
    },
];

const children: Child[] = [
    {
        id: "C1",
        parentId: "P1",
        content: "정규직 직원 식대 20만 원 지급",
    },
    {
        id: "C2",
        parentId: "P1",
        content: "수습 기간 식대 10만 원 지급",
    },
    {
        id: "C3",
        parentId: "P1",
        content: "계약직은 별도의 계약 조건 적용",
    },
    {
        id: "C4",
        parentId: "P2",
        content: "직원 건강검진 비용 지원",
    },
    {
        id: "C5",
        parentId: "P2",
        content: "배우자 건강검진 비용 일부 지원",
    },
];


const question = "ABC 회사의 식대는 얼마인가요?";

// Vector Search 결과라고 가정
const searchResults = [
  children[0], // C1
  children[1], // C2
];

console.log(searchResults);


// Parent ID 추출 및 중복 제거
const parentIds = [
  ...new Set(
    searchResults.map(child => child.parentId)
  ),
];

// Parent 문서 조회
const results = parents.filter(
  parent => parentIds.includes(parent.id)
);

console.log(results);

const context = results
  .map(parent => parent.content)
  .join("\n\n");

const prompt = `
참고자료:
${context}

질문:
${question}

참고자료를 기반으로 답변하세요.
`;

console.log(prompt);