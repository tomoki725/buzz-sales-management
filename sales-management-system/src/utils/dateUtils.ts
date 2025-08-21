// Date utility functions for free writing periods

/**
 * Get current week in ISO format (e.g., "2025-W32")
 */
export const getCurrentWeek = (): string => {
  const date = new Date();
  return getWeekString(date);
};

/**
 * Get current month in ISO format (e.g., "2025-08")
 */
export const getCurrentMonth = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get week string from Date object (e.g., "2025-W32")
 */
export const getWeekString = (date: Date): string => {
  const year = date.getFullYear();
  const weekNumber = getISOWeekNumber(date);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Get ISO week number (1-53)
 */
export const getISOWeekNumber = (date: Date): number => {
  // Copy date so don't modify original
  const tempDate = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNum + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);
};

/**
 * Get previous week string
 */
export const getPreviousWeek = (weekString: string): string => {
  const { year, week } = parseWeekString(weekString);
  if (week === 1) {
    // Go to last week of previous year
    return `${year - 1}-W${getLastWeekOfYear(year - 1).toString().padStart(2, '0')}`;
  }
  return `${year}-W${(week - 1).toString().padStart(2, '0')}`;
};

/**
 * Get next week string
 */
export const getNextWeek = (weekString: string): string => {
  const { year, week } = parseWeekString(weekString);
  const lastWeek = getLastWeekOfYear(year);
  if (week === lastWeek) {
    // Go to first week of next year
    return `${year + 1}-W01`;
  }
  return `${year}-W${(week + 1).toString().padStart(2, '0')}`;
};

/**
 * Get previous month string
 */
export const getPreviousMonth = (monthString: string): string => {
  const [year, month] = monthString.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${(month - 1).toString().padStart(2, '0')}`;
};

/**
 * Get next month string
 */
export const getNextMonth = (monthString: string): string => {
  const [year, month] = monthString.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${(month + 1).toString().padStart(2, '0')}`;
};

/**
 * Parse week string (e.g., "2025-W32") to year and week number
 */
export const parseWeekString = (weekString: string): { year: number; week: number } => {
  const match = weekString.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) {
    throw new Error('Invalid week string format');
  }
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10)
  };
};

/**
 * Get last week number of a year
 */
export const getLastWeekOfYear = (year: number): number => {
  const lastDate = new Date(year, 11, 31); // December 31st
  return getISOWeekNumber(lastDate);
};

/**
 * Get week number within a month (1-5) for a given date
 */
export const getWeekOfMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  
  // Calculate which week this date falls in within the month
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Adjust for Monday as first day of week (ISO standard)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Calculate week number (1-based)
  const weekNumber = Math.ceil((dayOfMonth + adjustedFirstDay) / 7);
  
  return weekNumber;
};

/**
 * Get date from week string (e.g., "2025-W32" -> Date object for that week's Monday)
 */
export const getDateFromWeekString = (weekString: string): Date => {
  const { year, week } = parseWeekString(weekString);
  
  // January 4th is always in the first week of the year
  const jan4 = new Date(year, 0, 4);
  
  // Calculate the Monday of the first week
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  
  // Add weeks to get to the target week
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  return targetMonday;
};

/**
 * Get start and end dates of a week from week string
 */
export const getWeekDateRange = (weekString: string): { startDate: Date; endDate: Date } => {
  const startDate = getDateFromWeekString(weekString); // Monday
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Sunday
  
  return { startDate, endDate };
};

/**
 * Format week string for display (e.g., "2025年8月8/21-27")
 */
export const formatWeekForDisplay = (weekString: string): string => {
  const { startDate, endDate } = getWeekDateRange(weekString);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  
  // Check if the week spans across months
  if (startDate.getMonth() !== endDate.getMonth()) {
    const endMonth = endDate.getMonth() + 1;
    return `${year}年${month}/${startDay}-${endMonth}/${endDay}`;
  }
  
  return `${year}年${month}月${startDay}-${endDay}`;
};

/**
 * Format month string for display (e.g., "2025年8月")
 */
export const formatMonthForDisplay = (monthString: string): string => {
  const [year, month] = monthString.split('-').map(Number);
  return `${year}年${month}月`;
};