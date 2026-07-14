import { GlobalNav } from "@/components/shell/global-nav";

/**
 * Settings shell. The top bar is the shared cream GlobalNav — unified with
 * the dashboard's (they were previously two duplicated dark navbars). The
 * settings pages themselves (billing, canvas) are still the old dark design
 * and keep their dark canvas below the bar until their own rebuild.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "transparent" }}>
      <GlobalNav />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-7xl w-full mx-auto page-enter">
        {children}
      </main>
    </div>
  );
}
