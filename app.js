// Load environment variables from .env file (only in development)
if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

// Import required packages
const express = require("express");
const app = express();

// Middleware to parse JSON and URL-encoded data from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import database and utility packages
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override"); // Allows PUT/DELETE via POST
const ejsMate = require("ejs-mate"); // Template engine for EJS
const ExpressError = require("./utils/ExpressError.js");

// Import authentication and session packages
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash"); // Flash messages for user feedback
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Import route handlers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { saveRedirectUrl } = require("./middleware.js");
const { error } = require("console");

// MongoDB connection URL (local database)
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const DB_URL = process.env.DATABASE_URL;

// Connect to MongoDB database
main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(DB_URL);
  // Note: For production, use: 'mongodb://user:password@127.0.0.1:27017/test'
}
// Configure EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware setup
app.use(methodOverride("_method")); // Enable PUT/DELETE via POST with ?_method=PUT
app.engine("ejs", ejsMate); // Use ejs-mate for template inheritance
app.use(express.static(path.join(__dirname, "/public"))); // Serve static files from public folder

const store = MongoStore.create({
  mongoUrl : DB_URL,
  crypto : {
    secret : process.env.SECRET,
  },
  touchAfter : 24 * 3600,
});

store.on("error", ()=>{
  console.log("Error in mongo session store", error);
})

// Session configuration for user authentication
const sessionOptions = {
  store,
  secret : process.env.SECRET, // Secret key for session encryption
  resave: false, // Don't save session if unmodified
  saveUninitialized: true, // Save new sessions
  cookie: {
    expires : Date.now() + 7*24*60*60*1000, // 7 days from now
    maxAge: 7*24*60*60*1000, // 7 days in milliseconds
    httpOnly: true, // Prevent client-side access to cookies
  }
};

// Home route
// app.get("/", (req, res) => {
//   res.send("Hi, My first server");
// });

// Session and authentication middleware
app.use(session(sessionOptions));
app.use(flash()); // Enable flash messages

// Passport authentication setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // Use local strategy for authentication

// Serialize/deserialize user for session management
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Middleware to make flash messages and current user available to all templates
app.use((req,res,next)=>{
  res.locals.success = req.flash("success"); // Success messages
  res.locals.error = req.flash("error"); // Error messages
  res.locals.currUser = req.user; // Current logged-in user
  res.locals.mapToken = process.env.MAP_TOKEN;
  next();
})

// Middleware to save redirect URL for after login
app.use(saveRedirectUrl);

// Demo user creation route (commented out for production)
// app.get("/demouser", async(req,res)=>{
//   let fakeUser = new User({
//     email : "demo@gmail.com",
//     username : "Demo-user"
//   });
//   let reguser = await User.register(fakeUser, "123456");
//   res.send(reguser);
// }) 

// Route handlers
app.use("/listings", listingRouter); // All listing routes
app.use("/listings/:id/reviews", reviewRouter); // Review routes (nested under listings)
app.use("/", userRouter); // User authentication routes

// 404 error handler - catch all unmatched routes
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// Global error handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "SOME ERROR HAS OCCURED!" } = err;
  res.status(statusCode).render("error", { message });
});

// Start the server
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
