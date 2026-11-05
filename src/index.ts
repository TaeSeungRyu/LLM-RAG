import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  saveMessage,
  getMessages,
} from './database.ts';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const MODEL = 'qwen3:1.7b';
const URL = 'http://localhost:11434/api/chat';

// 대화 기록

// 터미널 입력
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

// LLM 호출
async function askLLM(question: string) {
  const MAX_HISTORY = 10;

  const nextMessages: Message[] = [
    {
      role: 'system',
      content: '당신은 친절한 개발 강사입니다.',
    },
    ...getMessages(MAX_HISTORY * 2),
    {
      role: 'user',
      content: question,
    },
  ];

  console.log(
    'LLM에 전달한 메시지 수:',
    nextMessages.length
  );  

  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: nextMessages,
      stream: false,
      think: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const answer: string = data.message.content;

  // 요청 성공 후 대화 저장
  saveMessage('user', question);
  saveMessage('assistant', answer);



  console.log('\nAI:', answer);

  console.log(
    `Token: 입력 ${data.prompt_eval_count ?? 0}, 출력 ${data.eval_count ?? 0}`
  );
}

// 메인 루프
async function main() {
  console.log('로컬 LLM 챗봇 시작');
  console.log('종료하려면 exit 입력\n');

  try {
    while (true) {
      const question = (await rl.question('나: ')).trim();

      if (question.toLowerCase() === 'exit') {
        break;
      }

      if (!question) continue;

      try {
        await askLLM(question);
      } catch (error) {
        console.error('LLM 오류:', error);
      }

      console.log();
    }
  } finally {
    rl.close();
  }
}

main().catch(console.error);
