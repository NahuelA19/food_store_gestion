import { useState, useEffect, useRef, ChangeEvent } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = "Search products...",
  autoFocus = true,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedRef = useRef(debounce(onChange, 300));

  useEffect(() => {
    debouncedRef.current = debounce(onChange, 300);
  }, [onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedRef.current(newValue);
  }

  function handleClear() {
    setLocalValue("");
    onClear();
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Icon icon={Search} className="text-text-muted" />
      </div>
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-10"
        aria-label="Search products"
      />
      {localValue && !isLoading && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text-primary transition-colors"
          type="button"
        >
          <Icon icon={X} />
        </button>
      )}
      {isLoading && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
          <Icon icon={Loader2} className="animate-spin text-text-muted" />
        </div>
      )}
    </div>
  );
}
