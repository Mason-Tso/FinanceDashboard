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
      : env.ai.provider === "claude-cli"
        ? "Claude via local CLI (Max plan)"
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
        <SectionTitle>Robinhood via SnapTrade</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          With SnapTrade personal keys, your account is already provisioned — set your{" "}
          <code className="tnum text-fg">SNAPTRADE_USER_SECRET</code> and holdings flow in automatically (read-only; the
          dashboard cannot place trades). Use the button below only to link an additional brokerage.
        </p>
        <ConnectButton disabled={!env.snaptrade.canReadPortfolio} />
        {!env.snaptrade.canReadPortfolio && (
          <p className="mt-3 text-xs text-warn">
            Add <code className="tnum">SNAPTRADE_USER_ID</code> (your SnapTrade email) and{" "}
            <code className="tnum">SNAPTRADE_USER_SECRET</code> (from your SnapTrade dashboard) to{" "}
            <code className="tnum">.env.local</code>, then restart the dev server.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Data sources</SectionTitle>
        <StatusRow label="FMP" ok={env.fmp.isConfigured} detail="Quotes, fundamentals, news" />
        <StatusRow label="Quiver" ok={env.quiver.isConfigured} detail="Insider & congressional trades" />
        <StatusRow
          label="SnapTrade"
          ok={env.snaptrade.canReadPortfolio}
          detail={env.snaptrade.isConfigured && !env.snaptrade.userSecret ? "Keys set — add user secret to read holdings" : "Robinhood holdings (read-only)"}
        />
        <StatusRow label="AI analysis" ok={env.ai.isConfigured} detail={aiDetail} />
      </Card>
    </div>
  );
}
