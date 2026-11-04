
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('./data', { recursive: true });

const db = new DatabaseSync('./data/chat.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

// 메시지 저장
export function saveMessage(
    role: ChatMessage['role'],
    content: string
) {
    const stmt = db.prepare(`
    INSERT INTO messages (role, content)
    VALUES (?, ?)
  `);

    stmt.run(role, content);
}

// 최근 메시지 조회 (시간순으로 반환)
export function getMessages(
    limit = 20
): ChatMessage[] {
    const stmt = db.prepare(`
    SELECT role, content
    FROM (
      SELECT id, role, content
      FROM messages
      ORDER BY id DESC
      LIMIT ?
    )
    ORDER BY id ASC
  `);

    return stmt.all(limit) as ChatMessage[];
}
