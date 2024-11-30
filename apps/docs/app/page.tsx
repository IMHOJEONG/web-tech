import Link from "next/link";
import { getSortedPostsData } from "~/lib/util";

export default async function Page() {
  const data = await getSortedPostsData();
  return (
    <div className="flex flex-col gap-3 p-3">
      {data.map((doc) => {
        const { title, slug, id } = doc;
        if (!slug) {
          return null;
        }
        return (
          <Link href={`/${slug}`} key={id} className="hover:bg-gray-200">
            {title}
          </Link>
        );
      })}
    </div>
  );
}
