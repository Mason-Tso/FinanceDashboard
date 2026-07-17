/**
 * Claude via the local Claude Code CLI in print mode (`claude -p`).
 *
 * Runs against the user's logged-in subscription (e.g. Max) — no ANTHROPIC_API_KEY
 * and no per-token API billing. Unsupported/gray-area for apps, consumes the
 * subscription's rate limits, and requires the `claude` CLI installed + logged in.
 * The prompt is passed via stdin (never on the command line), so there is no
 * shell-injection surface.
 */

import "server-only";
import { spawn } from "node:child_process";

const TIMEOUT_MS = 60_000;

interface CliResult {
  result?: string;
  is_error?: boolean;
}

export function runClaudeCli(prompt: string, model?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const bin = process.env.CLAUDE_CLI_PATH || "claude";
    const args = ["-p", "--output-format", "json"];
    if (model) args.push("--model", model);

    // shell:true lets Windows resolve `claude.cmd`; prompt goes via stdin so
    // args contain only static flags (no untrusted input on the command line).
    const child = spawn(bin, args, { shell: true, windowsHide: true });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("claude CLI timed out"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 200)}`));
      try {
        const parsed = JSON.parse(stdout) as CliResult;
        if (parsed.is_error || typeof parsed.result !== "string") {
          return reject(new Error(`claude returned an error result`));
        }
        resolve(parsed.result);
      } catch {
        // Fallback: some versions emit raw text rather than a JSON envelope.
        resolve(stdout);
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
