"use client";

import { RankingTopBox } from "@/components/charts/ranking-top-box";
import { FlowBox } from "@/components/monitoring/flow-box";
import dynamic from "next/dynamic";

// import { NetworkTimelineChart } from "@/components/charts/network-timeline-chart";

const NetworkTimelineChart = dynamic(
  () =>
    import("@/components/charts/network-timeline/network-timeline-chart").then(
      (mod) => mod.NetworkTimelineChart,
    ),
  { ssr: false },
);
// 어떤 정보를 보여주고 싶은 거지?
// 모니터링, npm registry 정보?
export default function Home() {
  return (
    <div className="size-full grid grid-cols-2 gap-2">
      <FlowBox />
      <div className="flex flex-col gap-2">
        <NetworkTimelineChart />
        <div className="size-full">
          <RankingTopBox />
        </div>
      </div>
    </div>
  );
}
