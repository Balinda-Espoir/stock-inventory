
const express = require("express");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// Add a new product
router.post("/", async (req, res) => {
    try {
        // Check permissions
        const allowedRoles = ["superadmin", "admin", "storekeeper"];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You are not allowed to add products"
            });
        }

        const { name, sku, category, quantity, price } = req.body;

        if (!name || !sku || !category ||
            quantity === undefined || price === undefined) {
            return res.status(400).json({
                message: "Please provide all product details"
            });
        }

        const product = await Product.create({
            name,
            sku,
            category,
            quantity,
            price
        });

        res.status(201).json({
            message: "Product added successfully",
            product
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This SKU already exists"
            });
        }

        res.status(500).json({
            message: "Error adding product",
            error: error.message
        });
    }
});

// POST: Add a product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: View all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: View one product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Invalid product ID" });
  }
});

// PUT: Update product details or stock quantity
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Remove a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid product ID" });
  }
});

module.exports = router;
