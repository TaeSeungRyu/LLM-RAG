# LLM / RAG 학습

## 1. 사용 모델

| 구분 | 모델 | 용도 |
|---|---|---|
| LLM | `qwen3:1.7b` | 질문에 대한 답변 생성 |
| Embedding | `embeddinggemma` | 문장을 숫자 벡터로 변환 |

## 2. 모델 설치 (최초 1회)

**LLM 모델 설치**
```bash
ollama pull qwen3:1.7b
```

**Embedding 모델 설치**
```bash
ollama pull embeddinggemma
```

설치된 모델 확인:
```bash
ollama list
```

## 3. Ollama 실행

**Ollama 서버 실행 (서버가 실행 중이지 않을 때)**
```bash
ollama serve
```

**LLM 모델과 터미널에서 직접 대화**
```bash
ollama run qwen3:1.7b
```

> TypeScript에서 API를 호출할 때는 `ollama run`이 필요하지 않음. Ollama 서버만 실행되어 있으면 모델이 자동으로 로드됨.

## 4. API 주소

| 용도 | 주소 |
|---|---|
| LLM 채팅 | `http://localhost:11434/api/chat` |
| Embedding 생성 | `http://localhost:11434/api/embed` |

## 5. TypeScript 실행

**챗봇 실행**
```bash
node src/index.ts
```

**Embedding 실습**
```bash
node src/embedding.ts
```

## 6. 학습 진행 현황

- [x] Ollama 설치 및 로컬 LLM 실행
- [x] TypeScript에서 LLM API 호출
- [x] 대화 기록 관리
- [x] SQLite 대화 저장 및 복원
- [x] Embedding 기초
- [x] 코사인 유사도 계산
- [ ] Semantic Search (의미 기반 검색)
- [ ] RAG 구현
