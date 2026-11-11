
import { DatabaseSync } from "node:sqlite";
import {
  getEmbedding,
  cosineSimilarity
} from "./embedding.ts";

type DocumentRow = {
  id: number;
  content: string;
  embedding: string;
};

type Document = {
  id: number;
  content: string;
  embedding: number[];
};

const K = 3;

const tests = [
  {
    question: "ABC 회사의 근무 시간은?",
    expected: "오전 9시부터 오후 6시까지"
  },
  {
    question: "ABC 회사의 데이터베이스는?",
    expected: "PostgreSQL"
  },
  {
    question: "ABC 회사의 개발팀 인원은?",
    expected: "10명"
  }
];

// SQLite에서 문서와 벡터 조회
function loadDocuments(dbPath: string): Document[] {
  const db = new DatabaseSync(dbPath, {
    readOnly: true
  });

  try {
    const rows = db.prepare(
      "SELECT id, content, embedding FROM documents"
    ).all() as DocumentRow[];

    return rows.map(row => ({
      id: row.id,
      content: row.content,
      embedding: JSON.parse(row.embedding) as number[]
    }));
  } finally {
    db.close();
  }
}

// Chunking 방식별 평가
async function evaluateDatabase(
  name: string,
  documents: Document[],
  questionVectors: number[][]
) {
  let totalHit = 0;
  let totalRR = 0;

  console.log(`\n=== ${name} ===`);
  console.log("문서 수:", documents.length);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const questionVector = questionVectors[i];

    const results = documents
      .map(doc => ({
        ...doc,
        score: cosineSimilarity(
          questionVector,
          doc.embedding
        )
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, K);

    const index = results.findIndex(doc =>
      doc.content.includes(test.expected)
    );

    const hit = index === -1 ? 0 : 1;
    const rr = index === -1 ? 0 : 1 / (index + 1);

    totalHit += hit;
    totalRR += rr;

    console.log(`\n질문: ${test.question}`);
    console.log("Hit:", hit);
    console.log("RR:", rr.toFixed(4));

    console.table(
      results.map((doc, rank) => ({
        rank: rank + 1,
        score: doc.score.toFixed(4),
        correct: doc.content.includes(test.expected),
        content: doc.content
      }))
    );
  }

  return {
    name,
    hit: totalHit / tests.length,
    mrr: totalRR / tests.length
  };
}

// 메인 실행
async function main() {
  const characterDocs = loadDocuments(
    "data/compare-character.db"
  );

  const sentenceDocs = loadDocuments(
    "data/compare-sentence.db"
  );

  // 동일한 질문 벡터를 두 방식에 사용
  const questionVectors = await Promise.all(
    tests.map(test => getEmbedding(test.question))
  );

  const characterResult = await evaluateDatabase(
    "글자 단위 Chunking",
    characterDocs,
    questionVectors
  );

  const sentenceResult = await evaluateDatabase(
    "문장 단위 Chunking",
    sentenceDocs,
    questionVectors
  );

  console.log("\n=== 최종 비교 ===");

  console.table([
    {
      method: characterResult.name,
      hitAt3: characterResult.hit.toFixed(4),
      mrrAt3: characterResult.mrr.toFixed(4)
    },
    {
      method: sentenceResult.name,
      hitAt3: sentenceResult.hit.toFixed(4),
      mrrAt3: sentenceResult.mrr.toFixed(4)
    }
  ]);
}

await main();
