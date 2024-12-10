/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students. I acknowledge that violation
of this policy to any degree results in a ZERO for this assignment and possible failure of 
the course.

Name:                   Luca Novello
Student ID:             038515003
Date:                   12-11-2024
Vercel Web App URL:     https://web322app-lucanovello.vercel.app/
GitHub Repository URL:  https://github.com/lucanovello/web322-app
********************************************************************************/
require("dotenv").config();
const express = require("express");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");

const storeService = require("./store-service");
const authData = require("./auth-service");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.CS_SECRET,
    duration: 2 * 60 * 1000, // 2 minutes
    activeDuration: 1000 * 60, // 1 minute
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const upload = multer();

const hbs = exphbs.create({
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      const activeClass =
        url == app.locals.activeRoute
          ? "nav-menu-item active"
          : "nav-menu-item";
      return `<li class="${activeClass}">
              <a class="nav-menu-item-link" href="${url}">${options.fn(
        this
      )}</a>
            </li>`;
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (html) {
      // Use the Handlebars instance provided by `express-handlebars`
      return new hbs.handlebars.SafeString(html);
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
    formatPrice: function (price) {
      return parseFloat(price).toFixed(2);
    },
  },
});

// Configure the app to use the Handlebars engine
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

// MIDDLEWARE -----------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ROUTES -----------------------------------------------------------
// DB TEST ROUTE
app.get("/test-db", async (req, res) => {
  try {
    const db = mongoose.createConnection(process.env.MONGO_DB_CONN_STRING);
    db.once("open", () => res.send("Database connection successful!"));
    db.on("error", (err) => res.status(500).send(`Database error: ${err}`));
  } catch (err) {
    res.status(500).send(`Unexpected error: ${err}`);
  }
});

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

// SHOP ROUTES -----------------------------------------------------------
// GET: /shop
app.get("/shop", async (req, res) => {
  let viewData = {};
  try {
    // Get categories
    let categories = await storeService.getCategories();
    viewData.categories = categories;

    // Get items for the selected category or all items
    if (req.query.category) {
      viewData.items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
      viewData.viewingCategory = req.query.category;
    } else {
      viewData.items = await storeService.getPublishedItems();
    }

    // Set the first item as default if items are available
    if (viewData.items.length > 0) {
      viewData.item = viewData.items[0];
    } else {
      viewData.message = "No items available.";
    }
  } catch (err) {
    viewData.message = "An error occurred while loading the shop.";
  }
  res.render("shop", { data: viewData });
});

// GET: /shop/:id
app.get("/shop/:id", async (req, res) => {
  let viewData = {};
  try {
    // Get categories
    let categories = await storeService.getCategories();
    viewData.categories = categories;

    // Get items for the selected category or all items
    if (req.query.category) {
      viewData.items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
      viewData.viewingCategory = req.query.category;
    } else {
      viewData.items = await storeService.getPublishedItems();
    }

    // Fetch the requested item by ID
    viewData.item = await storeService.getItemById(req.params.id);

    // If the item isn't valid or doesn't exist, fallback to the first item
    if (!viewData.item && viewData.items.length > 0) {
      viewData.item = viewData.items[0];
    }
  } catch (err) {
    viewData.message = "An error occurred while loading the shop.";
  }
  res.render("shop", { data: viewData });
});

// ITEM ROUTES -----------------------------------------------------------
// GET: /Items
app.get("/items", ensureLogin, (req, res) => {
  storeService
    .getAllItems()
    .then((data) => {
      if (data.length > 0) {
        res.render("items", { data: { Items: data } });
      } else {
        res.render("items", { data: { message: "no results" } });
      }
    })
    .catch((err) => res.render("items", { data: { message: "no results" } }));
});

// GET: /Items/add
app.get("/items/add", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => res.render("addItem", { categories: data }))
    .then((data) => res.render("addItem", { categories: data }));
});

// POST: /Items/add
app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  (req, res) => {
    const processPost = () => {
      req.body.featureImage = imgUrl;
      storeService
        .addItem(req.body)
        .then(() => res.redirect("/items"))
        .catch((err) => res.status(500).send(err));
    };
    if (req.file) {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) imgUrl = result.url;
        processPost();
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    } else {
      req.body.featureImage = "";
      processPost();
    }
  }
);

// GET: /Items/delete/:id
app.get("/items/delete/:id", ensureLogin, (req, res) => {
  const itemId = req.params.id;
  storeService
    .deleteItemById(itemId)
    .then(() => res.redirect("/items"))
    .catch((err) =>
      res.status(500).send("Unable to Remove Item / Item not found")
    );
});

// CATEGORY ROUTES -----------------------------------------------------------
// GET: /categories
app.get("/categories", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      if (data.length > 0) res.render("categories", { categories: data });
      else res.render("categories", { message: "no results" });
    })
    .catch((err) => res.render("categories", { message: "no results" }));
});

// GET: /categories/add
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

// POST: /categories/add
app.post("/categories/add", ensureLogin, (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send(err));
});

// GET: /categories/delete/:id
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch((err) =>
      res.status(500).send("Unable to Remove Category / Category not found")
    );
});

// USER ROUTES -----------------------------------------------------------
// GET: /login

app.get("/login", (req, res) => {
  res.render("login");
});

// GET: /register
app.get("/register", (req, res) => {
  res.render("register");
});

// POST: /register
app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch((err) =>
      res.render("register", { errorMessage: err, userName: req.body.userName })
    );
});

// POST: /login
app.post("/login", (req, res) => {
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = user;
      res.redirect("/items");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

// GET: /logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// GET: /userHistory
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.use((req, res, next) => {
  res.status(404).render("404_page");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// START SERVER -----------------------------------------------------------
storeService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server is running on http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to start server:", err);
  });

module.exports = app;
