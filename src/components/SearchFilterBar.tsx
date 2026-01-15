import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, ArrowUpDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  onClearAll?: () => void;
  showClearButton?: boolean;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  sortOptions = [],
  sortValue,
  onSortChange,
  onClearAll,
  showClearButton = true,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    searchValue.length > 0 ||
    Object.values(filterValues).some((v) => v && v !== 'all') ||
    (sortValue && sortValue !== 'default');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] || 'all'}
              onValueChange={(value) => onFilterChange?.(filter.key, value)}
            >
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Sort Dropdown */}
          {sortOptions.length > 0 && (
            <Select
              value={sortValue || 'default'}
              onValueChange={(value) => onSortChange?.(value)}
            >
              <SelectTrigger className="w-[160px] bg-background">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="default">Default</SelectItem>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear All Button */}
          {showClearButton && hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
