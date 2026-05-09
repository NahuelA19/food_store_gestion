import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export function SearchInput({ onSearch, debounceMs = 300 }: SearchInputProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  function handleClear() {
    setQuery("");
    onSearch("");
  }

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Icon icon={Search} className="text-text-muted" />
      </div>
      <Input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
        role="searchbox"
        aria-label="Search products"
      />
      {query && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text-primary transition-colors"
          type="button"
        >
          <Icon icon={X} />
        </button>
      )}
    </div>
  );
}
