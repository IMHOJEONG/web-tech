import { getDocsData } from "~/lib/util";
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getDocsData();
  const target = data.find((doc) => doc.slug == slug);
  return <MDXRemote source={target?.content ?? "##"} />;
}
