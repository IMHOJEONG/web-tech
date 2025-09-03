"use client";

import { RankingTopBox } from "@/components/charts/ranking-top-box";
import { FlowBox } from "@/components/monitoring/flow-box";
import dynamic from "next/dynamic";

// import { NetworkTimelineChart } from "@/components/charts/network-timeline-chart";

const NetworkTimelineChart = dynamic(
  () =>
    import("../components/charts/network-timeline-chart").then(
      (mod) => mod.NetworkTimelineChart,
    ),
  { ssr: false },
);

export default function Home() {
  return (
    <div className="h-full flex flex-col gap-2">
      <FlowBox />
      <NetworkTimelineChart />
      <RankingTopBox />
    </div>
  );
}
