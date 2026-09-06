import { NavLink } from "react-router";
import { routes } from "@/app/router/routes";

const TAB_BASE =
  "relative flex-1 py-3 text-center font-mono text-micro font-medium uppercase tracking-[0.18em] transition-colors duration-200";

/**
 * Login / Register switcher.
 *
 * Two labels on one rule; the active one is marked by the same vermilion
 * underline the main nav uses, so the accent means "you are here" everywhere
 * in the product.
 */
export function AuthTabs({ active }: { active: "login" | "register" }) {
  return (
    <div className="mb-9 flex border-b border-rail">
      {(
        [
          { to: routes.login, label: "Sign in", key: "login" },
          { to: routes.register, label: "Create account", key: "register" },
        ] as const
      ).map((tab) => {
        const isActive = active === tab.key;
        return (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={`${TAB_BASE} ${isActive ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
          >
            {tab.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-[2px] origin-left bg-verm transition-transform duration-300 ease-out ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </NavLink>
        );
      })}
    </div>
  );
}
