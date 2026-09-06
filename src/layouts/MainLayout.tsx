import { Outlet } from "react-router";
import { DocumentTitle } from "@/shared/ui/DocumentTitle";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { Wordmark } from "@/shared/ui/Wordmark";
import { NavLink } from "react-router";
import { routes } from "@/app/router/routes";
import { CatalogueIndex } from "./components/CatalogueIndex";
import { MobileDock } from "./components/MobileDock";

/**
 * The gallery.
 *
 * Desktop: the catalogue index is a fixed column down the left edge and the
 * wall takes the rest. Phone: a slim plate at the top carries the mark and
 * the lighting, and the index becomes a dock at the bottom.
 *
 * There is no top navigation bar on any breakpoint — that arrangement is
 * what this direction exists to refuse.
 */
export default function MainLayout() {
  return (
    <>
      <DocumentTitle />

      <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Desktop: the index */}
        <aside className="sticky top-0 hidden h-screen border-r border-rail bg-plate lg:block">
          <CatalogueIndex />
        </aside>

        {/* Phone: the mark and the lighting */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-rail bg-plate/92 px-5 py-3 backdrop-blur-lg lg:hidden">
          <NavLink to={routes.home} aria-label="Aura, the wall">
            <Wordmark className="block w-[62px]" />
          </NavLink>
          <ThemeToggle />
        </header>

        <main className="min-w-0 pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileDock />
    </>
  );
}
