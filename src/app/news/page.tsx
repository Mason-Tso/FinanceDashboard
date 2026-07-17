import { NewsList } from "@/components/NewsList";
import { Card, SectionTitle, SourceTag } from "@/components/primitives";
import { getMarketNews } from "@/lib/fmp";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getMarketNews(40).catch(() => ({ data: [], source: "mock" as const }));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Market News</h1>
        <p className="mt-0.5 text-sm text-muted">Headlines that move the market, newest first.</p>
      </div>
      <Card className="p-5">
        <SectionTitle right={<SourceTag source={news.source} />}>Latest</SectionTitle>
        <NewsList items={news.data} />
      </Card>
    </div>
  );
}
