import { Link } from "react-router";
import { Plate } from "@/shared/ui/Plate";
import { routes } from "@/app/router/routes";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-5 py-16">
      <Plate className="w-full max-w-[520px] p-8 sm:p-10">
        <p className="font-mono text-micro font-medium tracking-[0.18em] text-verm-ink uppercase">
          No such record
        </p>

        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
          Nothing is catalogued at this address
        </h1>

        <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-ink-2">
          The work may have been withdrawn, or the number was never issued. The
          wall is where you left it.
        </p>

        <Link
          to={routes.home}
          viewTransition
          className="group/back mt-8 inline-flex items-center gap-3 font-mono text-micro font-medium tracking-[0.14em] text-ink uppercase"
        >
          <span className="h-px w-6 origin-left bg-verm transition-transform duration-200 ease-out group-hover/back:scale-x-150" />
          Back to the wall
        </Link>
      </Plate>
    </div>
  );
}
