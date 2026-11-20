
import { Tokenizer } from "@huggingface/tokenizers";
import { readFile } from "node:fs/promises";

const tokenizerJson = JSON.parse(
  await readFile("./tokenizer.json", "utf8")
);

const tokenizerConfig = JSON.parse(
  await readFile("./tokenizer_config.json", "utf8")
);

const tokenizer = new Tokenizer(
  tokenizerJson,
  tokenizerConfig
);

const texts = [
  "Hello World",
  "안녕하세요",
  "대한민국",
  "ABC 회사의 근무 시간은?",
];

for (const text of texts) {
  const result = tokenizer.encode(text);

  console.log("\n원본:", text);
  console.log("문자 길이:", text.length);
  console.log("토큰 개수:", result.ids.length);
  console.log("토큰 ID:", result.ids);
  console.log("토큰 조각:", result.tokens);
}
