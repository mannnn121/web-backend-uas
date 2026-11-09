const REPORT_UTC_OFFSET_HOURS = Number(process.env.REPORT_UTC_OFFSET_HOURS ?? 7);

export const getTodayRange = (now = new Date()) => {
	const offsetMs = REPORT_UTC_OFFSET_HOURS * 60 * 60 * 1000;
	const local = new Date(now.getTime() + offsetMs);
	const date = local.toISOString().slice(0, 10);
	const start = new Date(Date.parse(`${date}T00:00:00Z`) - offsetMs);
	const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

	return { date, start, end };
};
