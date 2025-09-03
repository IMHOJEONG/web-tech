import utc from "dayjs/plugin/utc";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const toKST = (date: string) => {
  return dayjs
    .tz(date, "Asia/Seoul")
    .locale("ko")
    .format("YYYY-MM-DD HH:mm:ss");
};
