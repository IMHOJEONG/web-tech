import Link from "next/link";
import Image from "next/image";

import localFont from "next/font/local";
import { cn } from "@web-tech/ui/lib/utils";

const headerLogoFont = localFont({ src: "fonts/header-logo.ttf" });

function Icon() {
  return (
    <a className="mr-4 flex items-center gap-2 lg:mr-6" href="/">
      <div className="w-6 h-6 relative">
        <Image src={"/logo.svg"} alt="" width={100} height={100} priority />
      </div>
      <span className={cn("font-bold", headerLogoFont.className)}>Net</span>
    </a>
  );
}

const navigation = [
  {
    href: "/",
    name: "문서",
  },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
      <div className="flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Icon />
          {navigation.map((nav) => {
            const { href, name } = nav;
            return (
              <nav
                key={name}
                className="flex items-center gap-4 text-sm xl:gap-6"
              >
                <Link
                  className="transition-colors hover:text-foreground/80 text-foreground/80"
                  href={href}
                >
                  {name}
                </Link>
              </nav>
            );
          })}
        </div>
      </div>
    </header>
  );
}
