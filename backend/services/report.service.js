import { prisma } from "../lib/prisma.js";

const getTodayRange = () => {
	const start = new Date();
	start.setHours(0, 0, 0, 0);

	const end = new Date(start);
	end.setDate(end.getDate() + 1);

	return { start, end };
};

export const getTodaySalesReportService = async () => {
	const { start, end } = getTodayRange();

	const [summary, orders] = await Promise.all([
		prisma.orders.aggregate({
			where: {
				created_at: {
					gte: start,
					lt: end,
				},
				payment_status: "paid",
			},
			_sum: {
				total_price: true,
			},
			_count: {
				id: true,
			},
		}),
		prisma.orders.findMany({
			where: {
				created_at: {
					gte: start,
					lt: end,
				},
			},
			include: {
				users: true,
			},
			orderBy: {
				created_at: "desc",
			},
		}),
	]);

	return {
		date: start.toISOString().slice(0, 10),
		total_sales: Number(summary._sum.total_price || 0),
		transaction_count: summary._count.id,
		orders,
	};
};

export const getLowStockReportService = async () => {
	const menus = await prisma.menus.findMany({
		orderBy: {
			stock: "asc",
		},
	});

	return menus.filter((menu) => {
		return Number(menu.stock || 0) <= Number(menu.minimum_stock || 0);
	});
};

export const getBestSellingReportService = async () => {
	const groupedItems = await prisma.order_items.groupBy({
		by: ["menu_id"],
		_sum: {
			quantity: true,
		},
		orderBy: {
			_sum: {
				quantity: "desc",
			},
		},
		take: 10,
	});

	const menus = await prisma.menus.findMany({
		where: {
			id: {
				in: groupedItems.map((item) => item.menu_id),
			},
		},
	});

	return groupedItems.map((item) => {
		const menu = menus.find((currentMenu) => currentMenu.id === item.menu_id);

		return {
			menu_id: item.menu_id,
			menu_name: menu?.name || `Menu #${item.menu_id}`,
			total_quantity: item._sum.quantity || 0,
		};
	});
};
