const express = require("express");
const router = express.Router();


// Import utilities and middleware
const wrapAsync = require("../utils/wrapAsync.js"); // Wrapper for async error handling
const { isLoggedIn, validateLisitng } = require("../middleware.js"); // Authentication and validation middleware
const ListingController = require("../controllers/listing.js"); // Listing controller functions

// File upload configuration
const multer = require("multer");
const {storage} = require("../cloudConfig.js"); // Cloudinary storage configuration
const upload = multer({storage}); // Multer middleware for file uploads
// Routes for listing operations
router
  .route("/")
  .get(wrapAsync(ListingController.index)) // GET /listings - Show all listings
  .post(
    isLoggedIn, // Require user to be logged in
    upload.single("listing[image][url]"), // Handle single file upload
    validateLisitng, // Validate listing data
    wrapAsync(ListingController.createListing) // POST /listings - Create new listing
  );

// Show form to create new listing
router.get("/new", isLoggedIn, (req, res) => {
  res.render("new");
});

// Routes for individual listing operations
router
  .route("/:id")
  .get(isLoggedIn, ListingController.showListing) // GET /listings/:id - Show single listing
  .put(isLoggedIn, upload.single("listing[image][url]"), validateLisitng, wrapAsync(ListingController.editListing)) // PUT /listings/:id - Update listing
  .delete(isLoggedIn, ListingController.destroyListing); // DELETE /listings/:id - Delete listing

// Show edit form for a listing
router.get("/:id/edit", isLoggedIn, ListingController.showEditListing);

module.exports = router;
