import { NpmRegistryReplicateRootResponseProps } from "@/app/api/npm-registry/replicate/route-schema";
import ky from "ky";

export const handleNpmRegistryReplicateData = async () => {
  const docs = await ky.get<NpmRegistryReplicateRootResponseProps>(
    "/api/npm-registry/replicate",
    {},
  );
  return docs.json();
};
