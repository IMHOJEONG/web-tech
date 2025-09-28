"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RankingTopResponse } from "cloudflare/resources/radar/ranking/ranking.mjs";
import { useEffect, useState } from "react";
import { handleRankingTopData } from "../../feature/ranking/top/api";

// https://recharts.org/en-US/guide/getting-started
export const RankingTopBox = () => {
  const [data, setData] = useState<{ domain: string; rank: number }[]>([]);

  const callData = async () => {
    // FIXME
    const response: RankingTopResponse = await handleRankingTopData();
    const { top_0 } = response;
    // const { categories, domain, rank } = top_0;
    const newData = top_0.map((top: RankingTopResponse.Top0) => {
      const { domain, rank } = top;
      return {
        domain: domain,
        rank: rank,
      };
    });
    setData(newData);
  };

  useEffect(() => {
    // handleData();

    callData();
  }, []);

  return (
    <div className="flex items-center justify-stretch gap-1 flex-wrap p-2">
      {data?.map((top) => (
        <Card key={top.domain} className="flex gap-1 flex-col p-4 size-full">
          <Badge className="flex gap-1">
            <div>TOP</div>
            <div>{top.rank}</div>
          </Badge>
          <Badge>{top.domain}</Badge>
        </Card>
      ))}
    </div>
  );
};
