const db = require("./src/config/db");
const { Rider, StoreLocation, Order, User } = require("./src/models/index");

(async () => {
  try {
    // Check stores
    const stores = await StoreLocation.findAll();
    console.log("=== STORES ===");
    console.log("Total stores:", stores.length);
    stores.forEach((s) =>
      console.log(`- ${s.id}: ${s.name} (Active: ${s.isActive})`),
    );
    

    // Check riders
    const riders = await Rider.findAll({
      include: [{ model: User, as: "user", attributes: ["name"] }],
    });
    console.log("\n=== RIDERS ===");
    console.log("Total riders:", riders.length);
    riders.forEach((r) => {
      console.log(
        `- ID: ${r.id}, Store: ${r.storeLocationId}, Available: ${r.isAvailable}, Verified: ${r.isVerified}, Status: ${r.status || "N/A"}, User: ${r.user?.name}`,
      );
      console.log(`  Coords: (${r.latitude}, ${r.longitude})`);
    });

    // Check latest orders
    const orders = await Order.findAll({
      include: [
        { model: User, as: "user", attributes: ["name"] },
        { model: Rider, as: "rider" },
      ],
      order: [["id", "DESC"]],
      limit: 5,
    });
    console.log("\n=== RECENT ORDERS ===");
    console.log("Total orders:", orders.length);
    orders.forEach((o) => {
      console.log(
        `- Order #${o.id}: Store ${o.storeLocationId}, Rider: ${o.riderId || "NONE"}, Status: ${o.status}`,
      );
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
