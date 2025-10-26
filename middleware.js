const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");

/**
 * Middleware to check if user is logged in
 * Redirects to login page if not authenticated
 */
module.exports.isLoggedIn = (req, res, next) =>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl; // Save the URL they were trying to access
        req.flash("error", "You must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
}


/**
 * Middleware to save redirect URL for after login
 * Makes redirectUrl available in templates
 */
module.exports.saveRedirectUrl = (req,res,next) =>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl; // Make available in templates
    }
    next();
}

/**
 * Middleware to validate listing data using Joi schema
 * Throws error if validation fails
 */
module.exports.validateLisitng = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

/**
 * Middleware to validate review data using Joi schema
 * Throws error if validation fails
 */
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    return next(new ExpressError(400, errMsg)); // Stops further execution
  }
  next();
};

/**
 * Middleware to check if current user is the author of a review
 * Only allows review author to delete/edit their review
 */
module.exports.isReviewAuthor = async (req,res,next) =>{
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
}