import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

/** Claude via the Anthropic API (paid, separate from any Max subscription). */
export async function runAnthropic(system: string, user: string, model?: string): Promise<string> {
  const client = new Anthropic({ apiKey: env.ai.anthropicKey! });
  const msg = await client.messages.create({
    model: model || "claude-sonnet-5",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
