"use client";

import { handleNpmRegistryReplicateAllDocsData } from "@/feature/npm-registry/replicate/all-docs-api";
import { ReactNode, useEffect, useState } from "react";

export default function Page(): ReactNode {
  const [data, setData] = useState("");
  const [length, setLength] = useState("");
  const handleData = async () => {
    const { totalLength, length } =
      await handleNpmRegistryReplicateAllDocsData();

    setData(totalLength);
    setLength(length);
  };

  useEffect(() => {
    handleData();
  }, []);

  return (
    <>
      <>{data}</>
      <>{length}</>
    </>
  );
}
