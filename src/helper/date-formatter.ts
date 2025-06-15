const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function formatDate(date: string, dateFormat: string) {
  const utcDate = new Date(date);
  const zonedDate = toZonedTime(utcDate, timeZone);
  return format(zonedDate, dateFormat);
}
