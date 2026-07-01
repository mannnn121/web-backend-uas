import {
	createOrderService,
	deleteOrderService,
	getOrderByIdService,
	getOrdersService,
} from "../services/order.service.js";

export const getOrders = async (req, res) => {
	try {
		const result = await getOrdersService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const getOrderById = async (req, res) => {
	try {
		const order_id = Number(req.params.id);
		const result = await getOrderByIdService(order_id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const addOrder = async (req, res) => {
	try {
		const result = await createOrderService(req.user.id, req.body);
		res.status(201).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const deleteOrder = async (req, res) => {
	try {
		const order_id = Number(req.params.id);
		const result = await deleteOrderService(order_id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
