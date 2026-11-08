# 06. RAG

## 개념
RAG(Retrieval-Augmented Generation, 검색 증강 생성)는 외부 자료를 검색한 뒤 그 자료를 LLM에 제공하여 답변을 생성하는 방식입니다.

## 목적
모델이 학습하지 않은 문서·사내 자료 등을 근거로 답변하도록 돕습니다.

## 동작 과정
```text
문서 → (Chunking) → Embedding → DB 저장
질문 → Embedding → 유사도 검색 → 관련 원문 추출
관련 원문 + 원래 질문 → LLM(qwen3:1.7b) → 답변
```

## 예시
```text
검색된 원문: "ABC 회사의 DB는 PostgreSQL입니다."
사용자 질문: "ABC 회사는 어떤 DB를 사용해?"
LLM 답변: "PostgreSQL을 사용합니다."
```

## 핵심 요약
- LLM에는 **벡터 숫자가 아니라 검색된 원문**을 전달합니다.
- Semantic Search는 자료를 찾고, RAG는 찾은 자료로 답변을 생성합니다.
- RAG도 잘못된 검색이나 환각을 완전히 없애지는 못합니다.
