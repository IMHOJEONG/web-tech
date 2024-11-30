import Header from "./header";
import "@web-tech/ui/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html className="size-full">
      <body className="size-full">
        <Header />
        {children}
      </body>
    </html>
  );
}
