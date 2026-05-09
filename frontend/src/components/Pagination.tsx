import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrevious,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        aria-label="Previous page"
      >
        <Icon icon={ChevronLeft} />
        Previous
      </Button>

      <span className="min-w-[140px] text-center text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Next page"
      >
        Next
        <Icon icon={ChevronRight} />
      </Button>
    </div>
  );
}
