const Category = require("../models/Category");

// 🧠 Utility to pick a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// ✅ Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const newCategory = await Category.create({ name, description });

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Show All Categories
exports.showAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Category Page Details
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!selectedCategory.course.length) {
      return res.status(404).json({
        success: false,
        message: "No published courses found in this category",
      });
    }

    // 🎲 Get different category (random, not the selected one)
    const otherCategories = await Category.find({ _id: { $ne: categoryId } });
    let differentCategory = null;

    if (otherCategories.length) {
      const randomCategory = getRandomItem(otherCategories);
      differentCategory = await Category.findById(randomCategory._id)
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec();
    }

    // 🔝 Top-selling courses across all categories
    const allCategories = await Category.find({})
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "instructor",
      })
      .exec();

    const allPublishedCourses = allCategories.flatMap((cat) => cat.course);
    const topSellingCourses = allPublishedCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses: topSellingCourses,
      },
    });
  } catch (error) {
    console.error("Error in category page details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};