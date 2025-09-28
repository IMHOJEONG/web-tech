import ky from "ky";

export const handleNpmRegistryReplicateAllDocsData = async () => {
  const docs = await ky.get<any>("/api/npm-registry/replicate/all-docs", {
    timeout: 60000 * 15, // 60 * 15 = 15분
  });
  return docs.json();
};
