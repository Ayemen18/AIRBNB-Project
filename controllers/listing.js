const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

/**
 * Display all listings (homepage)
 * GET /listings
 */
module.exports.index = async (req, res) => {
  const {q, filter} = req.query;
  let allListings;
  if(q){
    const regex = new RegExp(q,'i');
    allListings = await Listing.find({
      $or : [
        {title : regex},
        {location : regex},
        {country : regex},
      ],
    });
  }else if(filter){
    allListings = await Listing.find({ category: filter });
  }
  else{
    allListings = await Listing.find({});
  }

  res.render("index.ejs", { allListings, q, filter});
};

/**
 * Display a single listing with its reviews
 * GET /listings/:id
 */
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  // Find listing and populate reviews with their authors, and the listing owner
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  
  // If listing doesn't exist, show error and redirect
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("show", { listing });
};

/**
 * Create a new listing
 * POST /listings
 */
module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1
    })
    .send();

  // Extract listing data from request body
  const listingData = req.body.listing || {};
  const newListing = new Listing(listingData);
  newListing.owner = req.user._id; // Set the owner to current user
  
  // Handle file upload if present
  const url = req.file.path; // Cloudinary URL
  const filename = req.file.filename; // Cloudinary filename
  newListing.image = { url, filename };
  
  // Fix the geometry type case
  const geometry = response.body.features[0].geometry;
  console.log(geometry);
  if (geometry && geometry.type === 'Point') {
    geometry.type = 'point'; // Convert to lowercase
  }
  
  newListing.geometry = geometry;
  await newListing.save();
  
  req.flash("success", "New Listing created!");
  res.redirect("/listings");
};
/**
 * Show edit form for a listing
 * GET /listings/:id/edit
 */
module.exports.showEditListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("edit", { listing });
}

/**
 * Update a listing
 * PUT /listings/:id
 */
module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const updateData = req.body.listing || {};
    
    // Handle file upload - if new file uploaded, use it
    if (req.file) {
      const url = req.file.path; // Cloudinary URL
      const filename = req.file.filename; // Cloudinary filename
      updateData.image = { url, filename };
    } else if (typeof updateData.image === "string") {
      // If no new file but image field is string, treat as URL
      updateData.image = { url: updateData.image };
    }
    
    // If image field is empty, remove it to preserve existing image
    if (
      updateData.image &&
      typeof updateData.image.url === "string" &&
      updateData.image.url.trim() === ""
    ) {
      delete updateData.image; // preserve existing image if user clears the field
    }
    
    await Listing.findByIdAndUpdate(id, updateData);
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  }

/**
 * Delete a listing
 * DELETE /listings/:id
 */
module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");

  res.redirect("/listings");
}