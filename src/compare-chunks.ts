
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
    getEmbedding,
    cosineSimilarity
} from './embedding.ts';

const text = readFileSync(
    './data/company.txt',
    'utf-8'
);

// 기존 글자 수 기준 Chunking
function characterChunks(
    text: string,
    size = 100,
    overlap = 20
): string[] {
    const result: string[] = [];
    const step = size - overlap;

    for (let i = 0; i < text.length; i += step) {
        result.push(text.slice(i, i + size));
        if (i + size >= text.length) break;
    }

    return result;
}

// 문장 기준 Chunking + Overlap
function sentenceChunks(
    text: string,
    size = 100,
    overlap = 1
): string[] {
    const sentences = text
        .split(/(?<=[.!?。！？])\s+|\r?\n+/)
        .map(s => s.trim())
        .filter(Boolean);

    const result: string[] = [];
    let start = 0;

    while (start < sentences.length) {
        let end = start;
        let current = '';

        while (end < sentences.length) {
            const next = current
                ? `${current} ${sentences[end]}`
                : sentences[end];

            if (current && next.length > size) break;

            current = next;
            end++;
        }

        result.push(current);
        if (end >= sentences.length) break;

        start = Math.max(start + 1, end - overlap);
    }

    return result;
}

async function prepareDB(
    path: string,
    chunks: string[]
) {
    const db = new DatabaseSync(path);

    db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL UNIQUE,
      embedding TEXT NOT NULL
    )
  `);

    const insert = db.prepare(`
    INSERT OR IGNORE INTO documents
    (content, embedding) VALUES (?, ?)
  `);

    for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        insert.run(chunk, JSON.stringify(embedding));
    }

    return db;
}

type DocumentRow = {
    content: string;
    embedding: string;
};

async function search(
    db: DatabaseSync,
    question: string
) {
    const questionVector = await getEmbedding(question);

    const rows = db.prepare(
        'SELECT content, embedding FROM documents'
    ).all() as DocumentRow[];

    return rows
        .map(row => ({
            content: row.content,
            score: cosineSimilarity(
                questionVector,
                JSON.parse(row.embedding) as number[]
            )
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
}

//유사도 점수가 높다고 반드시 검색 품질이 더 좋은 것은 아니다!
async function main() {
    const charDB = await prepareDB(
        './data/compare-character.db',
        characterChunks(text)
    );

    const sentenceDB = await prepareDB(
        './data/compare-sentence.db',
        sentenceChunks(text)
    );

    try {
        //const question = 'ABC 회사는 어떤 데이터베이스를 사용하나요?';
        const question = 'ABC 회사의 주요 사업은 무엇인가요?';
        //const question = 'ABC 회사의 근무 시간은?';

        for (const [name, db] of [
            ['글자 수 기준', charDB],
            ['문장 기준', sentenceDB]
        ] as const) {
            const results = await search(db, question);

            console.log(`\n=== ${name} ===`);

            results.forEach((result, i) => {
                console.log(`\n${i + 1}위`);
                console.log('유사도:', result.score.toFixed(4));
                console.log('원문:', result.content);
                console.log(`-------------\n`);
            });
        }
    } finally {
        charDB.close();
        sentenceDB.close();
    }
}

main().catch(console.error);
