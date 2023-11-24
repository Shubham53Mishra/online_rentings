const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Index route (shows all listings)
module.exports.index = async (req, res,next) => {
  const allListing = await Listing.find();
  res.render("listings/index.ejs", { allListing });
};

// New route (new listing form reder)
module.exports.new = (req, res) => {
  // console.log(req.user);
  res.render("listings/new.ejs");
};

// Filtered Listings
module.exports.filteredListing = async (req, res) => {
  let { filter } = req.query;
  let filteredListing = await Listing.find({ category: filter });
  res.render("listings/filter.ejs", { filteredListing });
};

// module.exports.showListing =async(req,res) => {
//   // console.log ("Listings id");
//    let {id} = req.params;
//    console.log ("show "+id);
//    const listing= await Listing.findById(id)
//    .populate({ path: "reviews", populate: {path: "author"} })
//       .populate("owner");
//    console.log("lisint is                                   d  "+listing.owner);
//    if(!listing) {
//     req.flash("error"," Listing you requested for does not exits!");
//     req.redirect("/listings");
//    }
//   //  console.log ("listing "+listing);
//   //  console.log(listing);
//    res.render("listings/show.ejs",{listing});
//  };

// // Show route (show one listing in details)
module.exports.show = async (req, res) => {
  let { id } = req.params;
  // console.log(id);
  let listing = await Listing.findById(id)
  const list=await Listing.findById()
  .populate({ path: "reviews", populate: {path: "author"} })
  .populate("owner");
  // console.log(listing)
  if (!listing) {
    console.log("get post ");
    req.flash("error", "Listing you requested for does not exists !");
    res.redirect("/listings");
  }
  // res.send("Rout working")
  res.render("listings/show.ejs", { listing });
};

// Create route (new listing creater)
module.exports.create = async (req, res, next) => {
  let response = await  geocodingClient
  .forwardGeocode ({
    query: req.body.listing.location,
    limit:1
  })
  .send();

   const x=response.body.features[0].geometry;
   console.log("X is "+ x);
  // res.send("done!");

  let url = req.file.path;
  let filename = req.file.filename;
  let listing = req.body.listing;
  let newListing = new Listing(listing);
  newListing.image = { url, filename };
  newListing.owner = req.user._id;
  newListing.geometry = response.body.features[0].geometry;
  
   let savedListing = await newListing.save();
   console.log(savedListing);
  req.flash("success", "New Listing Successfully Created !!");
  res.redirect("/listings");
};

// Edit route (renders edit form of listings)
module.exports.edit = async (req, res,next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exists !");
    res.redirect("/listings");
  }
  let orignalImage = listing.image.url;
  let bluredImage = orignalImage.replace("/upload", "/upload/e_blur:500");
  res.render("listings/edit.ejs", { listing, bluredImage });
};

// Update route (updates listing details)
module.exports.update = async (req, res,next) => {
  let { id } = req.params;
  let coordinate = await geocodingClient
    .forwardGeocode({
      query: `${req.body.listing.location},${req.body.listing.country}`,
      limit: 2,
    })
    .send();

  req.body.listing.geometry = coordinate.body.features[0].geometry;
  let updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing);

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    updatedListing.save();
  }
  req.flash("success", "Listing Updated !!");
  res.redirect(`/listings/${id}`);
};

// Destroy route (deletes listing)
module.exports.destroy = async (req, res,next) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted !!");
  res.redirect("/listings");
};
