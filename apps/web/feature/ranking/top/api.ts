import { RankingTopResponse } from "cloudflare/resources/radar/ranking/ranking.mjs";
import ky from "ky";

// apiclient가 필요
export const handleRankingTopData = async () => {
  const response = await ky
    .post("/api/cloudflare/ranking/top", {
      json: {
        query: JSON.stringify({
          location: ["KR"],
        }),
      },
    })
    .json<RankingTopResponse>();
  return response;
};
