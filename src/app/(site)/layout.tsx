import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getCurrentSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header authed={Boolean(auth)} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
