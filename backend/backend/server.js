require("dotenv").config();

require("./src/migration/migrate");

require("./src/config/db");

// Seed admin user (for development)
// require("./src/seed/seedAdmin");

// Import routes
const registerRoute = require("./src/routes/register.route");
const loginRoute = require("./src/routes/login.route");
const verificationRoute = require("./src/routes/verification.route");
const storeLocationRoute = require("./src/routes/storeLocation.route");
const productRoute = require("./src/routes/product.route");
const riderRoute = require("./src/routes/rider.route");
const cartRoute = require("./src/routes/cart.route");
const orderRoute = require("./src/routes/order.route");
const riderAssignmentRoute = require("./src/routes/riderAssignment.route");
const stockAlertRoute = require("./src/routes/stockAlert.route");
const paymentRoute = require("./src/routes/payment.route");
const uploadPhotoRoute = require("./src/routes/uploadPhoto.route");

// Socket.IO
const { initSocket } = require("./src/socket/socketHandler");

const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
console.log("CORS configured to allow origin:", process.env.FRONTEND_URL);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to AI Halo API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/user",
      storeLocations: "/api/store-locations",
      products: "/api/products",
      riders: "/api/riders",
      cart: "/api/cart",
      orders: "/api/orders",
    },
  });
});

// Routes
app.use("/api/user", registerRoute);
app.use("/api/user", loginRoute);
app.use("/api/user", verificationRoute);
app.use("/api/store-locations", storeLocationRoute);
app.use("/api/products", productRoute);
app.use("/api/riders", riderRoute);
app.use("/api/rider-assignment", riderAssignmentRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/stock-alerts", stockAlertRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/upload", uploadPhotoRoute);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log(`AI Halo server running on port ${port}`);
});
