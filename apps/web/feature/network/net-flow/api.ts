import { NetflowTimeseriesResponse } from "cloudflare/resources/radar/netflows/netflows.mjs";
import ky from "ky";

export const handleTimeSeriesData = async () => {
  const zones = await ky.post<NetflowTimeseriesResponse>(
    "/api/cloudflare/netflows/timeseries",
    {
      json: {
        query: {
          aggInterval: ["15m"],
          asn: ["4766"],
          continent: ["AS"],
          dateRange: ["1d"],
        },
      },
    },
  );
  return zones.json();
};
