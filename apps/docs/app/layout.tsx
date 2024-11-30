import Header from "./header";
import "@web-tech/ui/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Header />
        <div className="px-6 py-0">{children}</div>
      </body>
    </html>
  );
}
