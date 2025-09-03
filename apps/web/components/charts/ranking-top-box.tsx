"use client";

import { RankingTopResponse } from "cloudflare/resources/radar/ranking/ranking.mjs";
import { useEffect, useState } from "react";
import { handleRankingTopData } from "../feature/ranking/top/api";
import { Badge } from "../ui/badge";

// https://recharts.org/en-US/guide/getting-started
export const RankingTopBox = () => {
  const [data, setData] = useState<{ domain: string; rank: number }[]>([]);

  const callData = async () => {
    // FIXME
    const response: RankingTopResponse = await handleRankingTopData();
    const { top_0 } = response;
    // const { categories, domain, rank } = top_0;
    const newData = top_0.map((top: RankingTopResponse.Top0, index: number) => {
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
    <div className="flex  gap-1 flex-wrap">
      {data.map((top) => (
        <div key={top.domain} className="flex ">
          <Badge>{top.rank}</Badge>
          <Badge>{top.domain}</Badge>
        </div>
      ))}
    </div>
  );
};
