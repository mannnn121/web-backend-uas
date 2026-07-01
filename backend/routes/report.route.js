import express from "express";
import {
	getBestSellingReport,
	getLowStockReport,
	getTodaySalesReport,
} from "../controllers/report.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("admin"));

router.get("/reports/today", getTodaySalesReport);
router.get("/reports/low-stock", getLowStockReport);
router.get("/reports/best-selling", getBestSellingReport);

export default router;
