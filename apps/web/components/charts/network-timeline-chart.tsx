"use client";

import { toKST } from "@/lib/get-timezone";
import { useEffect, useState } from "react";
import {
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { handleTimeSeriesData } from "../feature/network/net-flow/api";
import { CustomTick } from "./tick";

// https://recharts.org/en-US/guide/getting-started
export const NetworkTimelineChart = () => {
  const [data, setData] = useState<any>("");

  const callData = async () => {
    // FIXME
    const response: {
      serie_0: {
        timestamps: any;
        values: any;
      };
    } = await handleTimeSeriesData();
    console.log((response as any).serie_0);
    const { timestamps, values } = response.serie_0;
    const newData = timestamps.map((time: string, index: number) => {
      return {
        time: toKST(time),
        value: values[index],
      };
    });
    setData(newData);
  };

  useEffect(() => {
    // handleData();

    callData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart width={600} height={300} data={data}>
        {/* <Line dataKey="time" /> */}
        <Line dataKey="value" />
        <XAxis dataKey="time" tick={<CustomTick />} tickMargin={10}>
          <Label value="Time" position="insideBottom" offset={10} />
        </XAxis>
        <YAxis>
          <Label value="Value" position="insideLeft" offset={10} />
        </YAxis>
        <Tooltip />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
};
