import cors from "cors";
import express from "express";
import authRoute from "./routes/auth.route.js";
import menuRoute from "./routes/menu.route.js";
import orderRoute from "./routes/order.route.js";
import reportRoute from "./routes/report.route.js";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3002",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(authRoute);
app.use(menuRoute);
app.use(orderRoute);
app.use(reportRoute);

const startServer = async () => {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err);
  }
};

startServer();
