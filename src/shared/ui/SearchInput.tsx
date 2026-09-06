import { useId } from "react";
import { CloseIcon, SearchIcon } from "./icons";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  label: string;
  value: string;
  onClear: () => void;
}

/**
 * Search, as a ruled line rather than a boxed field.
 *
 * It carries the two affordances a search input is usually missing: the
 * glyph shifts to vermilion while the field has focus, and a clear control
 * appears as soon as there is something to clear — so getting back to the
 * unfiltered list never means selecting text and deleting it.
 */
export function SearchInput({
  label,
  value,
  onClear,
  className,
  ...rest
}: SearchInputProps) {
  const id = useId();

  return (
    <div className={`group/search relative ${className ?? ""}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <SearchIcon
        size={13}
        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-ink-3 transition-colors duration-200 group-focus-within/search:text-verm-ink"
      />

      <input
        id={id}
        type="search"
        value={value}
        className="w-full border-b border-rail bg-transparent py-2 pr-7 pl-6 font-mono text-label text-ink outline-none transition-colors duration-200 placeholder:text-ink-3 hover:border-rail-strong focus:border-verm"
        {...rest}
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer p-1 text-ink-3 transition-colors duration-200 hover:text-ink"
        >
          <CloseIcon size={12} />
        </button>
      ) : null}
    </div>
  );
}
