"use client";

import {
  Background,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { initialEdges, initialNodes } from "./data";

export const FlowBox = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  //   const handleData = async () => {
  //     const zones = await ky.post("/api/cloudflare/netflows/summary", {
  //       json: {
  //         query: {
  //           asn: ["4766"],
  //           continent: ["AS"],
  //           dateRange: ["7d"],
  //         },
  //       },
  //     });
  //     console.log(zones);
  //   };

  return (
    <div className="flex flex-col gap-2 size-full">
      <h1>Monitoring System</h1>
      <div className="size-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};
