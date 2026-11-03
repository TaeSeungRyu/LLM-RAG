
const OLLAMA_URL = 'http://localhost:11434/api/chat';

async function main() {
    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'qwen3:1.7b',
            stream: false,
            think: false,
            messages: [
                {
                    role: 'system',
                    content: '당신은 친절한 TypeScript 강사입니다.',
                },
                {
                    role: 'user',
                    content: 'LLM이 무엇인지 3줄로 설명해줘.',
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log('AI 답변:');
    console.log(data.message.content);
}

main().catch(console.error);
