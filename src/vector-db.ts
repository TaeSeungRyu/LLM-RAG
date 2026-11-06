
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('./data', { recursive: true });

const db = new DatabaseSync('./data/vectors.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL UNIQUE,
    embedding TEXT NOT NULL
  )
`);

export type Document = {
    id: number;
    content: string;
    embedding: number[];
};

// 문서 저장
export function saveDocument(
    content: string,
    embedding: number[]
) {
    const stmt = db.prepare(`
    INSERT OR IGNORE INTO documents (content, embedding)
    VALUES (?, ?)
  `);

    stmt.run(content, JSON.stringify(embedding));
}

// 전체 문서 조회
export function getDocuments(): Document[] {
    const stmt = db.prepare(`
    SELECT id, content, embedding
    FROM documents
  `);

    const rows = stmt.all() as {
        id: number;
        content: string;
        embedding: string;
    }[];

    return rows.map(row => ({
        id: row.id,
        content: row.content,
        embedding: JSON.parse(row.embedding) as number[],
    }));
}
