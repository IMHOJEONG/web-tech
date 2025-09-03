import ky from "ky";

export const handleTimeSeriesData = async () => {
  const zones = await ky.post<{
    serie_0: {
      timestamps: any;
      values: any;
    };
  }>("/api/cloudflare/netflows/timeseries", {
    json: {
      query: {
        aggInterval: ["15m"],
        asn: ["4766"],
        continent: ["AS"],
        dateRange: ["1d"],
      },
    },
  });
  return zones.json();
};
