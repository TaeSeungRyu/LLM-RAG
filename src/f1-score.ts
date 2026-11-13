/**
 * 
 * Precision@K : 검색한 결과 중 관련 문서 비율은?
 * Recall@K : 전체 관련 문서 중 얼마나 찾았는가?
 * F1@K : Precision과 Recall을 종합하면 어느 정도인가?
 */

function calculateF1(
    precision: number,
    recall: number
): number {
    if (precision + recall === 0) {
        return 0;
    }

    return (
        (2 * precision * recall) /
        (precision + recall)
    );
}

const precision = 0.8;
const recall = 0.4;

const f1 = calculateF1(precision, recall);

console.log("F1:", f1.toFixed(4));
// F1: 0.5333