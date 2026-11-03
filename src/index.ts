import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const MODEL = 'qwen3:1.7b';
const URL = 'http://localhost:11434/api/chat';

// 대화 기록
const messages: Message[] = [
  {
    role: 'system',
    content: '당신은 친절한 개발 강사입니다.',
  },
];

// 터미널 입력
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

// LLM 호출
async function askLLM(question: string) {
  const nextMessages: Message[] = [
    ...messages,
    { role: 'user', content: question },
  ];

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
  messages.push(
    { role: 'user', content: question },
    { role: 'assistant', content: answer }
  );

  // 이전 답변을 기억하는지 체크 해 보기 --*-*-*-*--*-*-*-*--*-*-*-*
  /***
   * 
    나: 내 이름은 철수야.
    나: 나는 인천에 살아.
    나: 나는 개발자야.
    나: 오늘은 LLM을 공부하고 있어.
    나: 내 이름이 뭐였지?
   */
  const MAX_HISTORY = 3;

  // system 메시지 제외
  const history = messages.slice(1);

  // 질문 + 답변 = 1쌍
  if (history.length > MAX_HISTORY * 2) {
    messages.splice(
      1,
      history.length - MAX_HISTORY * 2
    );
  }  

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
