import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const formatDate = (date: string) =>
  dayjs(date).format('ddd, D MMM YYYY, h.mma');
