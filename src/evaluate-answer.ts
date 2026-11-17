
//최종 답변 품질 평가 개념!!

type Evaluation = {
    correctness: number;
    faithfulness: number;
    relevance: number;
    reason: string;
};

type OllamaResponse = {
    message?: {
        content?: string;
    };
};

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen3:1.7b";

const question = "ABC 회사의 근무 시간은?";

const context = `
ABC 회사의 근무 시간은 오전 9시부터 오후 6시까지입니다.
ABC 회사는 주 5일 근무제를 운영합니다.
`.trim();

const expectedAnswer =
    "오전 9시부터 오후 6시까지입니다.";

//const generatedAnswer = "ABC 회사는 오전 9시부터 오후 6시까지 근무하며 재택근무도 가능합니다.";
const generatedAnswer =
  "ABC 회사의 근무 시간은 오전 9시부터 오후 6시까지입니다.";

// 점수가 0~1 범위인지 확인
function validateScore(
    value: unknown,
    name: string
): number {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    ) {
        throw new Error(`${name} 점수가 올바르지 않습니다.`);
    }

    return value;
}

// Ollama를 이용한 답변 평가
async function evaluateAnswer(): Promise<Evaluation> {
    const response = await fetch(
        `${OLLAMA_URL}/api/chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                stream: false,
                format: "json",
                options: {
                    temperature: 0,
                },
                messages: [
                    {
                        role: "system",
                        content: `
당신은 RAG 답변 품질 평가자입니다.

다음 기준으로 답변을 평가하세요.

1. correctness:
실제 정답과 얼마나 일치하는가?

2. faithfulness:
답변의 모든 사실적 주장이 참고자료로
뒷받침되는가?

3. relevance:
질문에 직접적으로 답하고 있는가?

각 항목을 0~1 사이 숫자로 평가하세요.

반드시 아래 JSON 형식으로 응답하세요.

{
  "correctness": 0.0,
  "faithfulness": 0.0,
  "relevance": 0.0,
  "reason": "평가 이유"
}
            `.trim(),
                    },
                    {
                        role: "user",
                        content: `
[질문]
${question}

[참고자료]
${context}

[정답]
${expectedAnswer}

[생성된 답변]
${generatedAnswer}
            `.trim(),
                    },
                ],
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Ollama API 오류: ${response.status}`
        );
    }

    const data =
        (await response.json()) as OllamaResponse;

    const content = data.message?.content;

    if (typeof content !== "string") {
        throw new Error("Ollama 응답 형식 오류");
    }

    const parsed: unknown = JSON.parse(content);

    if (
        typeof parsed !== "object" ||
        parsed === null
    ) {
        throw new Error("평가 결과 JSON 오류");
    }

    const result = parsed as Record<string, unknown>;

    return {
        correctness: validateScore(
            result.correctness,
            "correctness"
        ),
        faithfulness: validateScore(
            result.faithfulness,
            "faithfulness"
        ),
        relevance: validateScore(
            result.relevance,
            "relevance"
        ),
        reason:
            typeof result.reason === "string"
                ? result.reason
                : "평가 이유 없음",
    };
}
/**
개념 | 의미 | 확인할 질문
Correctness | 정답 정확성 | 실제 정답과 일치하는가?
Faithfulness | 근거 충실도 | 참고자료에 근거한 답변인가?
Answer Relevance | 질문 관련성 | 사용자의 질문에 제대로 답했는가?
 */
async function main(): Promise<void> {
    const result = await evaluateAnswer();

    console.log("\n===== RAG 답변 평가 =====");

    console.table({
        Correctness: result.correctness,
        Faithfulness: result.faithfulness,
        Relevance: result.relevance,
    });

    console.log("\n평가 이유:");
    console.log(result.reason);
}

main().catch(console.error);
