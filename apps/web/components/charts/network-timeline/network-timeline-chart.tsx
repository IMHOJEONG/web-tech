"use client";

import { handleTimeSeriesData } from "@/feature/network/net-flow/api";
import { toKST } from "@/lib/get-timezone";
import { useEffect, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NetworkTimelineTooltip } from "./network-timeline-tooltip";
import { CustomTick } from "./tick";

// https://recharts.org/en-US/guide/getting-started
export const NetworkTimelineChart = () => {
  const [data, setData] = useState<
    { time: string; value: string | undefined }[]
  >([]);

  const [time, setTime] = useState<string>("");

  const callData = async () => {
    // FIXME
    const { serie_0, meta } = await handleTimeSeriesData();
    const { timestamps, values } = serie_0;
    const newData = timestamps?.map((time: string, index: number) => {
      return {
        time: toKST(time),
        value: values[index],
      };
    });
    setData(newData);
    //  "meta": {
    //   "dateRange": [
    //     {
    //         "startTime": "2025-09-05T06:15:00Z",
    //         "endTime": "2025-09-06T06:15:00Z"
    //     }
    // ],

    const { startTime, endTime } = meta.dateRange.at(0) ?? {
      startTime: "시작 시간",
      endTime: "종료 시간",
    };
    setTime(`${startTime} ~ ${endTime}`);
  };

  useEffect(() => {
    // handleData();

    callData();
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2 size-full">
        <div className="text-sm text-gray-500">{time}</div>
        <ResponsiveContainer width="100%" height="80%" minHeight={200}>
          <LineChart width={600} height={200} data={data}>
            {/* <Line dataKey="time" /> */}
            <Line dataKey="value" />
            <XAxis dataKey="time" tick={<CustomTick />} tickMargin={10}>
              {/* <Label value="Time" position="insideBottom" offset={10} /> */}
            </XAxis>
            <YAxis>
              {/* <Label value="Value" position="insideLeft" offset={10} /> */}
            </YAxis>
            <Tooltip content={NetworkTimelineTooltip} />
            <Legend verticalAlign="top" height={36} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};
