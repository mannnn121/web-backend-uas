import {
	createOrderService,
	deleteOrderService,
	getOrderByIdService,
	getOrdersService,
} from "../services/order.service.js";

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
export const getOrders = async (req, res) => {
	try {
		const result = await getOrdersService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
export const getOrderById = async (req, res) => {
	try {
		const order_id = Number(req.params.id);
		const result = await getOrderByIdService(order_id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Menu not found
 *       409:
 *         description: Insufficient stock
 */
export const addOrder = async (req, res) => {
	try {
		const result = await createOrderService(req.user.id, req.body);
		res.status(201).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
export const deleteOrder = async (req, res) => {
	try {
		const order_id = Number(req.params.id);
		const result = await deleteOrderService(order_id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
