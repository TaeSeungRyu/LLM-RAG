
type SearchResult = {
    id: number;
    content: string;
    score: number;
};

function rerank(
    question: string,
    results: SearchResult[]
): SearchResult[] {
    const keywords = question
        .replace(/[?.,!]/g, "")
        .split(/\s+/)
        .filter((word) => word.length >= 2);

    return results
        .map((doc) => {
            const matches = keywords.filter((word) =>
                doc.content.includes(word)
            ).length;

            const keywordScore =
                keywords.length === 0
                    ? 0
                    : matches / keywords.length;

            return {
                ...doc,
                rerankScore:
                    doc.score * 0.7 + keywordScore * 0.3,
            };
        })
        .sort((a, b) => b.rerankScore - a.rerankScore);
}

const question = "ABC 회사의 근무 시간은?";

const results: SearchResult[] = [
    {
        id: 1,
        content: "ABC 회사는 주 5일 근무합니다.",
        score: 0.91,
    },
    {
        id: 2,
        content:
            "ABC 회사의 근무 시간은 오전 9시부터 오후 6시까지입니다.",
        score: 0.85,
    },
    {
        id: 3,
        content:
            "ABC 회사는 유연근무제를 검토하고 있습니다.",
        score: 0.80,
    },
];

console.table(rerank(question, results));
