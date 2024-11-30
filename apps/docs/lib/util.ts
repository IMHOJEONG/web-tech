import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface Metadata {
  id: string;
  title: string;
  date: string;
  summary: string;
  slug: string;
  content: string;
}

const docsDirectory = path.join(process.cwd(), "docs");

export function getDocsData() {
  const fileNames = fs.readdirSync(docsDirectory);
  const allPostsData: Partial<Metadata>[] = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.mdx?$/, "");

    // Read markdown file as string
    const fullPath = path.join(docsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);
    console.log(fileContents, matterResult);

    // Combine the data with the id
    return {
      id,
      ...matterResult.data,
      content: matterResult.content,
    };
  });

  return allPostsData;
}

export function getSortedPostsData() {
  const allPostsData = getDocsData();
  return allPostsData.sort((a, b) => {
    if (a.date && b.date && a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}
