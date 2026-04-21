// Mock setup
const mockProduct = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

const mockStoreLocation = {
  findOne: jest.fn(),
  findAll: jest.fn(),
};

jest.mock("../models/product.model", () => mockProduct);
jest.mock("../models/storeLocation.model", () => mockStoreLocation);
jest.mock("fs", () => ({
  unlinkSync: jest.fn(),
  existsSync: jest.fn(),
}));
jest.mock("../controller/stockAlert.controller", () => ({
  checkAndCreateAlerts: jest.fn().mockResolvedValue([]),
  STOCK_THRESHOLD: 20,
}));
jest.mock("../socket/socketHandler", () => ({
  emitStockAlert: jest.fn(),
}));

const fs = require("fs");
const {
  checkAndCreateAlerts,
} = require("../controller/stockAlert.controller");
const { emitStockAlert } = require("../socket/socketHandler");

const {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controller/product.controller");

// helpers for req and res
const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 1 },
  file: null,
  ...overrides,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("createProduct", () => {
  const validBody = {
    name: "Apple",
    description: "Fresh red apple",
    price: 150,
    category: "Groceries",
    stock: 100,
    storeLocationId: 1,
  };

  test("should return 400 if required fields are missing", async () => {
    const req = mockRequest({ body: { name: "Apple" } });
    const res = mockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Name, price, category, and store location are required",
      })
    );
  });

  test("should delete uploaded file if validation fails", async () => {
    const req = mockRequest({
      body: { name: "Apple" },
      file: { path: "/tmp/upload.jpg", filename: "upload.jpg" },
    });
    const res = mockResponse();

    await createProduct(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/upload.jpg");
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 403 if store location does not belong to admin", async () => {
    mockStoreLocation.findOne.mockResolvedValue(null);

    const req = mockRequest({ body: validBody });
    const res = mockResponse();

    await createProduct(req, res);

    expect(mockStoreLocation.findOne).toHaveBeenCalledWith({
      where: { id: 1, adminId: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Store location not found or unauthorized",
      })
    );
  });

  test("should create product successfully without image", async () => {
    const createdProduct = { id: 1, ...validBody, imageUrl: null };
    mockStoreLocation.findOne.mockResolvedValue({ id: 1, adminId: 1 });
    mockProduct.create.mockResolvedValue(createdProduct);

    const req = mockRequest({ body: validBody });
    const res = mockResponse();

    await createProduct(req, res);

    expect(mockProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Apple",
        price: 150,
        category: "Groceries",
        imageUrl: null,
        stock: 100,
        storeLocationId: 1,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product created successfully",
        data: createdProduct,
      })
    );
  });

  test("should create product with image URL when file is uploaded", async () => {
    const createdProduct = {
      id: 1,
      ...validBody,
      imageUrl: "/uploads/products/img123.jpg",
    };
    mockStoreLocation.findOne.mockResolvedValue({ id: 1, adminId: 1 });
    mockProduct.create.mockResolvedValue(createdProduct);

    const req = mockRequest({
      body: validBody,
      file: { path: "/tmp/img123.jpg", filename: "img123.jpg" },
    });
    const res = mockResponse();

    await createProduct(req, res);

    expect(mockProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "/uploads/products/img123.jpg",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("should return 500 and delete file on unexpected error", async () => {
    mockStoreLocation.findOne.mockRejectedValue(
      new Error("DB connection lost")
    );

    const req = mockRequest({
      body: validBody,
      file: { path: "/tmp/img.jpg", filename: "img.jpg" },
    });
    const res = mockResponse();

    await createProduct(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/img.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal server error",
      })
    );
  });
});

describe("getAllProducts", () => {
  test("should return all active products with status 200", async () => {
    const products = [
      { id: 1, name: "Apple", isActive: true },
      { id: 2, name: "Banana", isActive: true },
    ];
    mockProduct.findAll.mockResolvedValue(products);

    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await getAllProducts(req, res);

    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: products,
    });
  });

  test("should filter by storeLocationId when provided", async () => {
    mockProduct.findAll.mockResolvedValue([]);

    const req = mockRequest({ query: { storeLocationId: "5" } });
    const res = mockResponse();

    await getAllProducts(req, res);

    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, storeLocationId: "5" },
      })
    );
  });

  test("should filter by category when provided", async () => {
    mockProduct.findAll.mockResolvedValue([]);

    const req = mockRequest({ query: { category: "Electronics" } });
    const res = mockResponse();

    await getAllProducts(req, res);

    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, category: "Electronics" },
      })
    );
  });

  test("should filter by both storeLocationId and category", async () => {
    mockProduct.findAll.mockResolvedValue([]);

    const req = mockRequest({
      query: { storeLocationId: "3", category: "Groceries" },
    });
    const res = mockResponse();

    await getAllProducts(req, res);

    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          storeLocationId: "3",
          category: "Groceries",
        },
      })
    );
  });

  test("should return 500 on database error", async () => {
    mockProduct.findAll.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal server error",
      })
    );
  });
});

describe("getMyProducts", () => {
  test("should return products belonging to admin's stores", async () => {
    const storeLocations = [{ id: 10 }, { id: 20 }];
    const products = [
      { id: 1, name: "Rice", storeLocationId: 10 },
      { id: 2, name: "Flour", storeLocationId: 20 },
    ];
    mockStoreLocation.findAll.mockResolvedValue(storeLocations);
    mockProduct.findAll.mockResolvedValue(products);

    const req = mockRequest({ user: { id: 5 } });
    const res = mockResponse();

    await getMyProducts(req, res);

    expect(mockStoreLocation.findAll).toHaveBeenCalledWith({
      where: { adminId: 5 },
      attributes: ["id"],
    });
    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          storeLocationId: [10, 20],
          isActive: true,
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: products,
    });
  });

  test("should return empty array when admin has no stores", async () => {
    mockStoreLocation.findAll.mockResolvedValue([]);
    mockProduct.findAll.mockResolvedValue([]);

    const req = mockRequest({ user: { id: 99 } });
    const res = mockResponse();

    await getMyProducts(req, res);

    expect(mockProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeLocationId: [], isActive: true },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
  });

  test("should return 500 on database error", async () => {
    mockStoreLocation.findAll.mockRejectedValue(
      new Error("Connection failed")
    );

    const req = mockRequest();
    const res = mockResponse();

    await getMyProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getProductById", () => {
  test("should return product when found", async () => {
    const product = {
      id: 1,
      name: "Laptop",
      price: 85000,
      storeLocation: { id: 1, name: "Main Store", address: "Kathmandu" },
    };
    mockProduct.findByPk.mockResolvedValue(product);

    const req = mockRequest({ params: { id: "1" } });
    const res = mockResponse();

    await getProductById(req, res);

    expect(mockProduct.findByPk).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        include: expect.any(Array),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: product,
    });
  });

  test("should return 404 when product is not found", async () => {
    mockProduct.findByPk.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "999" } });
    const res = mockResponse();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("should return 500 on database error", async () => {
    mockProduct.findByPk.mockRejectedValue(new Error("Query timeout"));

    const req = mockRequest({ params: { id: "1" } });
    const res = mockResponse();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal server error",
      })
    );
  });
});

describe("updateProduct", () => {
  const existingProduct = {
    id: 1,
    name: "Old Name",
    description: "Old desc",
    price: 100,
    category: "Groceries",
    imageUrl: "/uploads/products/old.jpg",
    stock: 50,
    isActive: true,
    update: jest.fn().mockResolvedValue(true),
  };

  test("should return 404 if product not found or unauthorized", async () => {
    mockProduct.findByPk.mockResolvedValue(null);

    const req = mockRequest({
      params: { id: "999" },
      body: { name: "New Name" },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Product not found or unauthorized",
      })
    );
  });

  test("should delete uploaded file if product not found", async () => {
    mockProduct.findByPk.mockResolvedValue(null);

    const req = mockRequest({
      params: { id: "999" },
      body: { name: "New" },
      file: { path: "/tmp/new.jpg", filename: "new.jpg" },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/new.jpg");
  });

  test("should update product fields successfully", async () => {
    const updatedProduct = {
      id: 1,
      name: "Updated Apple",
      price: 200,
      stock: 30,
    };
    mockProduct.findByPk
      .mockResolvedValueOnce(existingProduct)
      .mockResolvedValueOnce(updatedProduct);

    const req = mockRequest({
      params: { id: "1" },
      body: { name: "Updated Apple", price: 200, stock: 30 },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(existingProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Apple",
        price: 200,
        stock: 30,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      })
    );
  });

  test("should replace image and delete old file when new image is uploaded", async () => {
    fs.existsSync.mockReturnValue(true);

    const productWithOldImage = {
      ...existingProduct,
      imageUrl: "/uploads/products/old.jpg",
      update: jest.fn().mockResolvedValue(true),
    };
    const updatedProduct = { id: 1, imageUrl: "/uploads/products/new.jpg" };

    mockProduct.findByPk
      .mockResolvedValueOnce(productWithOldImage)
      .mockResolvedValueOnce(updatedProduct);

    const req = mockRequest({
      params: { id: "1" },
      body: { name: "Apple" },
      file: { path: "/tmp/new.jpg", filename: "new.jpg" },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(productWithOldImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "/uploads/products/new.jpg",
      })
    );
  });

  test("should trigger stock alert when stock falls below threshold", async () => {
    const lowStockProduct = { id: 1, name: "Apple", stock: 5 };
    mockProduct.findByPk
      .mockResolvedValueOnce(existingProduct)
      .mockResolvedValueOnce(lowStockProduct);

    checkAndCreateAlerts.mockResolvedValue([
      { id: 1, productId: 1, message: "Low stock" },
    ]);

    const req = mockRequest({
      params: { id: "1" },
      body: { stock: 5 },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(checkAndCreateAlerts).toHaveBeenCalledWith([1]);
    expect(emitStockAlert).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 1 })
    );
  });

  test("should return 500 and delete file on unexpected error", async () => {
    mockProduct.findByPk.mockRejectedValue(new Error("Unexpected"));

    const req = mockRequest({
      params: { id: "1" },
      body: {},
      file: { path: "/tmp/err.jpg", filename: "err.jpg" },
    });
    const res = mockResponse();

    await updateProduct(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/err.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("deleteProduct", () => {
  test("should soft-delete product by setting isActive to false", async () => {
    const product = {
      id: 1,
      name: "Apple",
      isActive: true,
      update: jest.fn().mockResolvedValue(true),
    };
    mockProduct.findByPk.mockResolvedValue(product);

    const req = mockRequest({ params: { id: "1" }, user: { id: 1 } });
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(product.update).toHaveBeenCalledWith({ isActive: false });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Product deleted successfully",
    });
  });

  test("should return 404 if product not found or unauthorized", async () => {
    mockProduct.findByPk.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "999" }, user: { id: 1 } });
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found or unauthorized",
    });
  });

  test("should verify product belongs to admin's store", async () => {
    mockProduct.findByPk.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "1" }, user: { id: 7 } });
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(mockProduct.findByPk).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            where: { adminId: 7 },
          }),
        ]),
      })
    );
  });

  test("should return 500 on database error", async () => {
    mockProduct.findByPk.mockRejectedValue(new Error("DB crashed"));

    const req = mockRequest({ params: { id: "1" } });
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal server error",
      })
    );
  });
});
