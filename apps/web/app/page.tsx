"use client";

import { RankingTopBox } from "@/components/charts/ranking-top-box";
import { FlowBox } from "@/components/monitoring/flow-box";
import dynamic from "next/dynamic";

import "./css/monitoring.scss";

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
    <div className="monitoring-layout">
      {/* Left large panel */}
      <div className="monitoring-left">
        <FlowBox />
      </div>

      {/* Right group */}
      <div className="monitoring-right">
        <div className="monitoring-chart">
          <NetworkTimelineChart />
        </div>

        <div className="monitoring-ranking">
          <RankingTopBox />
        </div>
      </div>
    </div>
  );
}
