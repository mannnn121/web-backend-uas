import express from "express";
import {
	addOrder,
	deleteOrder,
	getOrderById,
	getOrders,
} from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.post("/orders", addOrder);
router.delete("/orders/:id", deleteOrder);

export default router;
