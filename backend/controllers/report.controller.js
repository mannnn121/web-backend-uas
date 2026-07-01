import {
	getBestSellingReportService,
	getLowStockReportService,
	getTodaySalesReportService,
} from "../services/report.service.js";

export const getTodaySalesReport = async (req, res) => {
	try {
		const result = await getTodaySalesReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const getLowStockReport = async (req, res) => {
	try {
		const result = await getLowStockReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const getBestSellingReport = async (req, res) => {
	try {
		const result = await getBestSellingReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
