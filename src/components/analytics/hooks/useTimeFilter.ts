// /home/ubuntu/src/components/analytics/hooks/useTimeFilter.ts
import { useState, useCallback, useMemo } from "react";

export type TimePreset = "today" | "7d" | "30d" | "year" | "all" | "custom";

export interface TimeFilterState {
  startDate: Date | null;
  endDate: Date | null;
  preset: TimePreset;
}

// Helper function to get date range based on preset
const getDateRange = (preset: TimePreset): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  let startDate: Date | null = new Date(today);
  let endDate: Date | null = new Date(now); // End is current time for today/7d/30d

  switch (preset) {
    case "today":
      startDate = today;
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999); // End of today
      break;
    case "7d":
      startDate.setDate(today.getDate() - 6); // Today + 6 previous days
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999); // End of today
      break;
    case "30d":
      startDate.setMonth(today.getMonth(), today.getDate() - 29); // Today + 29 previous days
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999); // End of today
      break;
    case "year":
      startDate = new Date(today.getFullYear(), 0, 1); // Start of current year
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999); // End of current year
      break;
    case "all":
      startDate = null; // Representing all time
      endDate = null;
      break;
    case "custom":
      // Custom range is handled by setDateRange
      startDate = null;
      endDate = null;
      break;
    default:
      startDate = today;
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  }
  return { startDate, endDate };
};

export const useTimeFilter = (initialPreset: TimePreset = "30d") => {
  const initialRange = getDateRange(initialPreset);
  const [filterState, setFilterState] = useState<TimeFilterState>({
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    preset: initialPreset,
  });

  const setPreset = useCallback((newPreset: TimePreset) => {
    const { startDate, endDate } = getDateRange(newPreset);
    // Only update if it's not a custom range being set via preset
    if (newPreset !== "custom") {
        setFilterState({ startDate, endDate, preset: newPreset });
    }
     // If switching TO custom, keep existing dates or clear them?
     // Current behavior: switching to custom via preset button doesn't change dates
     // but sets the preset identifier.
     else {
        setFilterState(prev => ({ ...prev, preset: "custom" }));
     }
  }, []);

  const setDateRange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFilterState({
      startDate,
      endDate,
      preset: "custom", // Setting specific dates always results in a custom preset
    });
  }, []);

  const value = useMemo(() => ({
    ...filterState,
    setPreset,
    setDateRange,
  }), [filterState, setPreset, setDateRange]);

  return value;
};

