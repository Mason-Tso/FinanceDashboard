import { ConnectButton } from "@/components/ConnectButton";
import { Card, SectionTitle } from "@/components/primitives";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft/60 py-3 last:border-0">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        <div className="text-xs text-faint">{detail}</div>
      </div>
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
          ok ? "bg-up-soft text-up" : "bg-surface-2 text-faint"
        }`}
      >
        {ok ? "Configured" : "Not set"}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const aiDetail =
    env.ai.provider === "rules"
      ? "Rules engine (no LLM)"
      : env.ai.isConfigured
        ? `${env.ai.provider} — key present`
        : `${env.ai.provider} — key missing`;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted">Connect your data sources. Keys live in <code className="tnum text-fg">.env.local</code>.</p>
      </div>

      <Card className="p-5">
        <SectionTitle>Connect Robinhood</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Linking runs through SnapTrade&apos;s secure portal — you enter your Robinhood login on{" "}
          <span className="text-fg">SnapTrade&apos;s</span> site, never here. Access is read-only; the dashboard cannot
          place trades.
        </p>
        <ConnectButton disabled={!env.snaptrade.isConfigured} />
        {!env.snaptrade.isConfigured && (
          <p className="mt-3 text-xs text-warn">
            Add <code className="tnum">SNAPTRADE_CLIENT_ID</code> and <code className="tnum">SNAPTRADE_CONSUMER_KEY</code>{" "}
            to <code className="tnum">.env.local</code>, then restart the dev server.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Data sources</SectionTitle>
        <StatusRow label="FMP" ok={env.fmp.isConfigured} detail="Quotes, fundamentals, news" />
        <StatusRow label="Quiver" ok={env.quiver.isConfigured} detail="Insider & congressional trades" />
        <StatusRow label="SnapTrade" ok={env.snaptrade.isConfigured} detail="Brokerage / Robinhood connection" />
        <StatusRow label="AI analysis" ok={env.ai.isConfigured} detail={aiDetail} />
      </Card>
    </div>
  );
}
