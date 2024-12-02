import { compileMDX } from "next-mdx-remote/rsc";
import { PropsWithChildren } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getDocsData } from "~/lib/util";
import CodeBlock from "./codeblock";

import remarkGfm from "remark-gfm";

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
  const { content: mdxSource } = await compileMDX({
    source: target?.content ?? "## 12",
    components: components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeAutolinkHeadings],

        format: "mdx",
      },
    },
  });

  return <>{mdxSource}</>;
}
