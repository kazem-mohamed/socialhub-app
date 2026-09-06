import { useId } from "react";

interface InlineSelectOption {
  value: string;
  label: string;
}

interface InlineSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
  /** Announced to screen readers; never painted. */
  label: string;
  options: InlineSelectOption[];
}

/**
 * The compact select used inside a toolbar rather than a form — sorting a
 * list, switching a view. It carries no box: it sits on the surface as a
 * mono label with a chevron, and only picks up an underline on hover and
 * focus, so a control that is usually left alone does not compete with the
 * content it is filtering.
 */
export function InlineSelect({ label, options, className, ...rest }: InlineSelectProps) {
  const id = useId();

  return (
    <div className={`group/inline relative ${className ?? ""}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <select
        id={id}
        className="cursor-pointer appearance-none border-b border-transparent bg-transparent py-1 pr-5 font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase outline-none transition-colors duration-200 hover:border-rail-strong hover:text-ink focus:border-verm focus:text-ink"
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-ink-3 transition-colors duration-200 group-hover/inline:text-ink"
      >
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
          <path
            d="M1 1L4.5 4.5L8 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
