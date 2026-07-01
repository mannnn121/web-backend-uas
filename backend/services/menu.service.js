import { prisma } from "../lib/prisma.js";

const parseMenuId = (id) => {
	const menuId = Number(id);

	if (!Number.isInteger(menuId) || menuId <= 0) {
		const error = new Error("Invalid menu id");
		error.statusCode = 400;
		throw error;
	}

	return menuId;
};

const parseStockField = (value, fieldName) => {
	const parsedValue = Number(value);

	if (!Number.isInteger(parsedValue) || parsedValue < 0) {
		const error = new Error(`${fieldName} must be a valid positive integer`);
		error.statusCode = 400;
		throw error;
	}

	return parsedValue;
};

const validateMenuInput = (
	{ name, price, stock, minimum_stock },
	{ isPartial = false } = {},
) => {
	const data = {};

	if (name !== undefined) {
		if (typeof name !== "string" || !name.trim()) {
			const error = new Error("Menu name is required");
			error.statusCode = 400;
			throw error;
		}

		data.name = name.trim();
	}

	if (price !== undefined) {
		const parsedPrice = Number(price);

		if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
			const error = new Error("Menu price must be a valid positive number");
			error.statusCode = 400;
			throw error;
		}

		data.price = parsedPrice;
	}

	if (stock !== undefined) {
		data.stock = parseStockField(stock, "Menu stock");
	}

	if (minimum_stock !== undefined) {
		data.minimum_stock = parseStockField(minimum_stock, "Minimum stock");
	}

	if (!isPartial && (!data.name || data.price === undefined)) {
		const error = new Error("Menu name and price are required");
		error.statusCode = 400;
		throw error;
	}

	if (isPartial && Object.keys(data).length === 0) {
		const error = new Error("At least one menu field is required");
		error.statusCode = 400;
		throw error;
	}

	return data;
};

export const getMenusService = async () => {
	return prisma.menus.findMany({
    where: {
      is_active: true
		},
    orderBy: {
      id: "asc",
    },
	});
};

export const getMenuByIdService = async (id) => {
	const menuId = parseMenuId(id);
	const menu = await prisma.menus.findUnique({
		where: { id: menuId, is_active: true },
	});

	if (!menu) {
		const error = new Error("Menu not found");
		error.statusCode = 404;
		throw error;
	}

	return menu;
};

export const createMenuService = async (payload) => {
	const data = validateMenuInput(payload);
	
  const existing = await prisma.menus.findFirst({
    where: { name: data.name, is_active: false }
	})

  if (existing) {
    const error = new Error("Menu already exists but is inactive");
    error.statusCode = 409;
    error.existingMenuId = existing.id;
    error.existingMenuData = existing;
    throw error;
  }
	
	return prisma.menus.create({
		data,
	});
};

export const updateMenuService = async (id, payload) => {
	const menuId = parseMenuId(id);
	const data = validateMenuInput(payload, { isPartial: true });

	try {
		return await prisma.menus.update({
			where: { id: menuId },
			data,
		});
	} catch (error) {
		if (error.code === "P2025") {
			const notFoundError = new Error("Menu not found");
			notFoundError.statusCode = 404;
			throw notFoundError;
		}

		throw error;
	}
};

export const deactivateMenuService = async (id) => {
	const menuId = parseMenuId(id);

	try {
    await prisma.menus.update({
      where: {id: menuId},
			data: { is_active: false },
		});

		return { message: "Menu deactivated successfully" };
	} catch (error) {
		if (error.code === "P2025") {
			const notFoundError = new Error("Menu not found");
			notFoundError.statusCode = 404;
			throw notFoundError;
		}

		// if (error.code === "P2003") {
		// 	const relationError = new Error(
		// 		"Menu cannot be deleted because it is used by orders",
		// 	);
		// 	relationError.statusCode = 409;
		// 	throw relationError;
		// }

		throw error;
	}
};

export const reactivateMenuService = async (id) => {
  const menuId = parseMenuId(id);

  try {
    return await prisma.menus.update({
      where: { id: menuId },
      data: { is_active: true },
    });
  } catch (error) {
    if (error.code === "P2025") {
      const notFoundError = new Error("Menu not found");
      notFoundError.statusCode = 404;
    }

    throw error;
  }
};