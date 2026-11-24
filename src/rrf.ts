//RRF는 서로 다른 검색 방식의 점수 척도 문제를 해결하기 위해 점수 대신 순위를 활용하여 검색 결과를 통합하는 알고리즘!
//BM25, Vector Search를 비교
//점수 = {k+순위} / 1
const vectorResults = ["A", "B", "C"];
const bm25Results = ["C", "D", "A"];

const scores = new Map<string, number>();

const k = 60;

for (const results of [vectorResults, bm25Results]) {

    results.forEach((id, index) => {

        const rank = index + 1;

        const score = 1 / (k + rank);

        const prevScore = scores.get(id) ?? 0;

        scores.set(id, prevScore + score);

    });

}

const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1]);

console.table(ranked);
