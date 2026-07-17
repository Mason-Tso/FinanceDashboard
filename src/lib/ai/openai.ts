import "server-only";
import OpenAI from "openai";
import { env } from "../env";

/** GPT via the OpenAI API. */
export async function runOpenAI(system: string, user: string, model?: string): Promise<string> {
  const client = new OpenAI({ apiKey: env.ai.openaiKey! });
  const res = await client.chat.completions.create({
    model: model || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}
