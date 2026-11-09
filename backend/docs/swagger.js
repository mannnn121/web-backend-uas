import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Anderson POS API",
      version: "1.0.0",
      description:
        "API documentation for Anderson POS System - a restaurant point of sale application.",
    },
    servers: [
      {
        url: "/api/backend",
        description: "Current host",
      },
      {
        url: "http://localhost:3000/api/backend",
        description: "Development server",
      },
      {
        url: "https://web-backend-uas-production.up.railway.app/api/backend",
        description: "Production server (Railway)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        Menu: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            price: { type: "number", format: "decimal" },
            stock: { type: "integer" },
            minimum_stock: { type: "integer" },
            is_active: { type: "boolean" },
          },
        },
        MenuInput: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string" },
            price: { type: "number" },
            stock: { type: "integer" },
            minimum_stock: { type: "integer" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            status: { type: "string", enum: ["pending", "completed", "cancelled"] },
            total_price: { type: "string" },
            payment_method: { type: "string", enum: ["cash", "qris"] },
            paid_amount: { type: "string" },
            change_amount: { type: "string" },
            payment_reference: { type: "string", nullable: true },
            payment_status: { type: "string", enum: ["paid", "unpaid"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
        OrderInput: {
          type: "object",
          required: ["payment_method", "items"],
          properties: {
            payment_method: { type: "string", enum: ["cash", "qris"] },
            paid_amount: { type: "number" },
            payment_reference: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["menu_id", "quantity"],
                properties: {
                  menu_id: { type: "integer" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            token: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string", enum: ["admin", "cashier"] },
              },
            },
          },
        },
        TodayReport: {
          type: "object",
          properties: {
            date: { type: "string" },
            total_sales: { type: "number" },
            transaction_count: { type: "integer" },
            orders: {
              type: "array",
              items: { $ref: "#/components/schemas/Order" },
            },
          },
        },
        LowStockItem: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            price: { type: "string" },
            stock: { type: "integer" },
            minimum_stock: { type: "integer" },
            is_active: { type: "boolean" },
          },
        },
        BestSellingItem: {
          type: "object",
          properties: {
            menu_id: { type: "integer" },
            menu_name: { type: "string" },
            total_quantity: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
