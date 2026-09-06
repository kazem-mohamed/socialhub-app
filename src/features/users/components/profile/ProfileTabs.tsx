export type ProfileTab = "posts" | "saved";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  count: number;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "saved", label: "Saved" },
];

/** The same underline tab language the nav and notifications use. */
export function ProfileTabs({ activeTab, count, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-rail">
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-pressed={isActive}
              className={`relative cursor-pointer px-4 py-3.5 font-mono text-micro font-medium tracking-[0.18em] uppercase transition-colors duration-200 first:pl-0 ${
                isActive ? "text-ink" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {tab.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-px h-[2px] origin-left bg-verm transition-transform duration-300 ease-out ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <span className="font-mono text-micro tracking-[0.16em] text-ink-3 uppercase tabular-nums">
        {count}
      </span>
    </div>
  );
}
