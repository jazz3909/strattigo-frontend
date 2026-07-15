import { GlobalNav } from "@/components/shell/global-nav";

/**
 * Settings shell — the shared cream GlobalNav over a cream page canvas
 * (matches the dashboard shell; the old dark gradient behind settings pages
 * is retired). Billing is the live settings surface; /settings/canvas is
 * dormant (unlinked) until the Canvas feature ships.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-page text-ink">
      <GlobalNav />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-20 page-enter">
        {children}
      </main>
    </div>
  );
}
