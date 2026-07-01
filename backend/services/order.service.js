import { CashPayment } from "../classes/CashPayment.js";
import { QrisPayment } from "../classes/QrisPayment.js";
import { prisma } from "../lib/prisma.js";

const allowedPaymentMethods = ["cash", "qris"];

const createHttpError = (message, statusCode) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
};

const parseOrderId = (id) => {
	const orderId = Number(id);

	if (!Number.isInteger(orderId) || orderId <= 0) {
		throw createHttpError("Invalid order id", 400);
	}

	return orderId;
};

const parseItems = (items) => {
	if (!Array.isArray(items) || items.length === 0) {
		throw createHttpError("Order items are required", 400);
	}

	const itemMap = new Map();

	for (const item of items) {
		const menuId = Number(item.menu_id);
		const quantity = Number(item.quantity);

		if (!Number.isInteger(menuId) || menuId <= 0) {
			throw createHttpError("Each order item must have a valid menu_id", 400);
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw createHttpError("Each order item must have a valid quantity", 400);
		}

		itemMap.set(menuId, (itemMap.get(menuId) || 0) + quantity);
	}

	return [...itemMap.entries()].map(([menuId, quantity]) => ({
		menu_id: menuId,
		quantity,
	}));
};

const validatePayment = ({
	payment_method,
	paid_amount,
	payment_reference,
	totalPrice,
}) => {
	if (!allowedPaymentMethods.includes(payment_method)) {
		throw createHttpError("Payment method must be cash or qris", 400);
	}

	try {
		const payment =
			payment_method === "cash"
				? new CashPayment({ paidAmount: paid_amount, totalPrice })
				: new QrisPayment({
						paidAmount: paid_amount,
						totalPrice,
						paymentReference: payment_reference,
					});

		return payment.toOrderData();
	} catch (error) {
		throw createHttpError(error.message, 400);
	}
};

export const getOrdersService = async () => {
	return prisma.orders.findMany({
		include: {
			order_items: {
				include: {
					menus: true,
				},
			},
			users: true,
		},
		orderBy: {
			created_at: "desc",
		},
	});
};

export const getOrderByIdService = async (orderId) => {
	const parsedOrderId = parseOrderId(orderId);
	const order = await prisma.orders.findUnique({
		where: { id: parsedOrderId },
		include: {
			order_items: {
				include: {
					menus: true,
				},
			},
			users: true,
		},
	});

	if (!order) {
		throw createHttpError("Order not found", 404);
	}

	return order;
};

export const createOrderService = async (userId, payload) => {
	if (!userId) {
		throw createHttpError("Authenticated user is required", 401);
	}

	const items = parseItems(payload.items);
	const menuIds = items.map((item) => item.menu_id);
	const uniqueMenuIds = [...new Set(menuIds)];

	const menus = await prisma.menus.findMany({
		where: { id: { in: uniqueMenuIds } },
		select: {
			id: true,
			name: true,
			price: true,
			stock: true,
		},
	});

	if (menus.length !== uniqueMenuIds.length) {
		throw createHttpError("One or more menu items were not found", 404);
	}

	let totalPrice = 0;
	const orderItems = items.map((item) => {
		const menu = menus.find((currentMenu) => currentMenu.id === item.menu_id);
		const stock = menu.stock ?? 0;

		if (stock < item.quantity) {
			throw createHttpError(`${menu.name} does not have enough stock`, 409);
		}

		const price = Number(menu.price);
		const subtotal = price * item.quantity;
		totalPrice += subtotal;

		return {
			menu_id: item.menu_id,
			quantity: item.quantity,
			price,
		};
	});
	
	const payment = validatePayment({
		payment_method: payload.payment_method,
		paid_amount: payload.paid_amount,
		payment_reference: payload.payment_reference?.trim() || `QRIS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
		totalPrice,
	});

	return prisma.$transaction(async (tx) => {
		for (const item of items) {
			await tx.menus.update({
				where: { id: item.menu_id },
				data: {
					stock: {
						decrement: item.quantity,
					},
				},
			});
		}

		return tx.orders.create({
			data: {
				user_id: userId,
				status: "completed",
				total_price: totalPrice,
				...payment,
				order_items: {
					create: orderItems,
				},
			},
			include: {
				order_items: {
					include: {
						menus: true,
					},
				},
				users: true,
			},
		});
	});
};

export const deleteOrderService = async (orderId) => {
	const parsedOrderId = parseOrderId(orderId);

	try {
		await prisma.order_items.deleteMany({
			where: { order_id: parsedOrderId },
		});

		await prisma.orders.delete({
			where: {
				id: parsedOrderId,
			},
		});

		return { message: "Order deleted successfully" };
	} catch (error) {
		if (error.code === "P2025") {
			throw createHttpError("Order not found", 404);
		}

		throw error;
	}
};
