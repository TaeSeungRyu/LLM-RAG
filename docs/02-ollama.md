# 02. Ollama

## 개념
Ollama는 로컬 컴퓨터에서 AI 모델을 실행하고 HTTP API로 호출하게 해주는 도구입니다.

## 목적
외부 API 없이 로컬 LLM과 Embedding 모델을 실습합니다.

## 동작 과정
```text
TypeScript(fetch) → Ollama 서버 → 모델 실행 → 응답
```

## 주요 명령과 API
| 명령/API | 용도 |
|---|---|
| `ollama pull qwen3:1.7b` | LLM 다운로드 |
| `ollama pull embeddinggemma` | Embedding 모델 다운로드 |
| `ollama list` | 설치된 모델 확인 |
| `ollama serve` | 서버가 실행 중이지 않을 때 시작 |
| `POST /api/chat` | LLM 대화 |
| `POST /api/embed` | Embedding 생성 |

## 핵심 요약
서버가 이미 실행 중이면 `ollama run` 없이도 API로 모델을 호출할 수 있습니다.
