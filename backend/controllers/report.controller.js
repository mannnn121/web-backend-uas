import {
	getBestSellingReportService,
	getLowStockReportService,
	getTodaySalesReportService,
} from "../services/report.service.js";

/**
 * @openapi
 * /reports/today:
 *   get:
 *     tags: [Reports]
 *     summary: Get today's sales report (admin & cashier)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's sales data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodayReport'
 */
export const getTodaySalesReport = async (req, res) => {
	try {
		const result = await getTodaySalesReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /reports/low-stock:
 *   get:
 *     tags: [Reports]
 *     summary: Get low stock menus (admin & cashier)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LowStockItem'
 */
export const getLowStockReport = async (req, res) => {
	try {
		const result = await getLowStockReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /reports/best-selling:
 *   get:
 *     tags: [Reports]
 *     summary: Get best selling menus (admin & cashier)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of best selling menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BestSellingItem'
 */
export const getBestSellingReport = async (req, res) => {
	try {
		const result = await getBestSellingReportService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
