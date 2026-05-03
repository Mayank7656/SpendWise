const Category = require("../models/Category");
const Transaction = require("../models/Transaction");

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;
    if (!name || !type) {
      res.status(400);
      throw new Error("Category name and type are required");
    }

    const category = await Category.create({
      user: req.user._id,
      name,
      type,
      color: color || "#2563eb"
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message = "This category already exists";
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const updates = (({ name, type, color }) => ({ name, type, color }))(req.body);
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    const used = await Transaction.exists({ user: req.user._id, category: category._id });
    if (used) {
      res.status(409);
      throw new Error("Categories with transactions cannot be deleted");
    }

    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
