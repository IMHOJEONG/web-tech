import { getDocsData } from "~/lib/util";
import { MDXRemote } from "next-mdx-remote/rsc";
import CodeBlock from "./codeblock";
import { PropsWithChildren } from "react";

const components = {
  // pre: (props: PropsWithChildren<{ className?: string }>) => {
  //   const { className, children } = props;
  //   return <pre className="not-prose">{children}</pre>;
  // },
  pre: (props: PropsWithChildren<{ className?: string }>) => {
    const { className, children } = props;
    
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getDocsData();
  const target = data.find((doc) => doc.slug == slug);
  const mdxSource = target?.content ?? "## 12";

  return <MDXRemote source={mdxSource} components={components} />;
}
