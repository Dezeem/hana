import { KonamiEgg } from "@/components/konami-egg";
import { MobileNav } from "@/components/mobile-nav";
import { ShortcutsPanel } from "@/components/shortcuts-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:text-[15px] focus:text-ink"
      >
        跳到主要内容
      </a>
      <SiteHeader />
      <main id="main" className="flex-1 pb-24 pt-24 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileNav />
      <ShortcutsPanel />
      <KonamiEgg />
    </div>
  );
}
