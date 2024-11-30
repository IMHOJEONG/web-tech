import Link from "next/link";
import Image from "next/image";

function Icon() {
  return (
    <a className="mr-4 flex items-center gap-2 lg:mr-6" href="/">
      <div className="w-6 h-6 relative">
        <Image src={"/logo.svg"} layout="fill" objectFit="cover" alt="" />
      </div>
      <span className="font-bold">Net</span>
    </a>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
      <div className="flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Icon />
          <nav className="flex items-center gap-4 text-sm xl:gap-6">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/80"
              href="/docs"
            >
              문서
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
