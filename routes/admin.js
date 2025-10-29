const express = require("express");
const router = express.Router();

// صفحه ورود ادمین
router.get("/login", (req, res) => {
  res.render("admin-login", { error: null });
});

// پردازش فرم ورود
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error("❌ ADMIN_USER یا ADMIN_PASS در .env تعریف نشده‌اند!");
    return res.status(500).send("خطای تنظیمات سرور");
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = {
      username: ADMIN_USER,
      display_name: "مدیر سیستم",
      is_admin: true,
    };
    return res.redirect("/admin/dashboard");
  }

  res.render("admin-login", { error: "نام کاربری یا رمز اشتباه است." });
});

// صفحه داشبورد ادمین
router.get("/dashboard", (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect("/admin/login");
  }

  res.render("admin-dashboard", { user: req.session.user });
});

// خروج ادمین
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
