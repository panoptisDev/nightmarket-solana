import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRangeOption } from '../components/Chart';

export function formatTimeAgo(date: Date) {
  const pastDate = new Date(date);

  const result = formatDistanceToNow(pastDate);
  return result;
}

export function getDateTimeRange(dateRangeOption: DateRangeOption): {
  startTime: string;
  endTime: string;
} {
  const startTime = format(
    subDays(startOfDay(new Date()), parseInt(dateRangeOption)),
    "yyyy-MM-dd'T'hh:mm:ssxxx"
  ) as string;
  const endTime = format(endOfDay(new Date()), "yyyy-MM-dd'T'hh:mm:ssxxx") as string;
  return { startTime, endTime };
}
