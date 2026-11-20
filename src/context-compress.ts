type Chunk = {
    id: number;
    content: string;
    score: number;
};

// 질문과 관련된 문장만 추출하는 간단한 예제
function compressChunk(
    question: string,
    chunk: Chunk
): Chunk {
    const keywords = question
        .replace(/[?.,]/g, "")
        .split(/\s+/)
        .filter(word => word.length >= 2);

    const sentences = chunk.content
        .split(/(?<=[.!?])\s+/);

    const relevant = sentences.filter(sentence =>
        keywords.some(keyword =>
            sentence.includes(keyword)
        )
    );

    return {
        ...chunk,
        content: relevant.join(" ")
    };
}


const chunk: Chunk = {
  id: 1,
  score: 0.95,
  content:
    "ABC 회사의 직원은 50명입니다. " +
    "ABC 회사의 근무 시간은 오전 9시부터 오후 6시입니다. " +
    "개발팀은 10명입니다."
};

const result = compressChunk(
  "ABC 회사의 근무 시간은?",
  chunk
);

console.log(result.content);