
import { searchChunks } from './chunk-search.ts';

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen3:1.7b';

async function askRAG(question: string) {
    // 1. 관련 Chunk 검색
    const results = await searchChunks(question);



    // 2. 유사도 기준으로 필터링
    const THRESHOLD = 0.5;
    const documents = results.filter(
        (doc) => {
            //console.log('score : ',doc.score)
            return doc.score >= THRESHOLD
        }
    );

    if (documents.length === 0) {
        console.log('관련 자료를 찾지 못했습니다.');
        return;
    }

    // 3. 검색된 Chunk 원문을 하나로 합치기
    const context = documents
        .map(doc => doc.content)
        .join('\n\n');

    console.log('\n[검색된 참고 자료]');
    console.log(context);

    // 4. LLM에 질문과 참고 자료 전달
    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            stream: false,
            think: false,
            messages: [
                {
                    role: 'system',
                    content: `
당신은 회사 정보를 안내하는 AI입니다.
반드시 제공된 참고 자료를 바탕으로 답변하세요.
참고 자료에 없는 내용은 추측하지 마세요.
정보가 부족하면 모른다고 답변하세요.
          `.trim(),
                },
                {
                    role: 'user',
                    content: `
[참고 자료]
${context}

[질문]
${question}
          `.trim(),
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`LLM 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    console.log('\n[AI 답변]');
    console.log(data.message.content);
}

// 테스트
await askRAG('ABC 회사의 근무 시간은 어떻게 되나요?');
