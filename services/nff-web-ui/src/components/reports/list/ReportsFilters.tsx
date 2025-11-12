import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerNative } from '@/components/ui/date-picker-native';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Calendar } from 'lucide-react';

interface ReportsFiltersProps {
  searchValue: string;
  categoryValue: string;
  dateFromValue: string;
  dateToValue: string;
  dateRangeError: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onRefresh: () => void;
}

export function ReportsFilters({
  searchValue,
  categoryValue,
  dateFromValue,
  dateToValue,
  dateRangeError,
  onSearchChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
  onRefresh,
}: ReportsFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-[180px]">
          <Select value={categoryValue} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePickerNative
            value={dateFromValue ? new Date(dateFromValue) : undefined}
            onChange={onDateFromChange}
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <DatePickerNative
            value={dateToValue ? new Date(dateToValue) : undefined}
            onChange={onDateToChange}
            placeholder="To"
          />
        </div>

        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {dateRangeError && (
        <div className="text-sm text-destructive">{dateRangeError}</div>
      )}
    </div>
  );
}



