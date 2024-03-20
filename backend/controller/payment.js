const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// router.post(
//   "/process",
//   catchAsyncErrors(async (req, res, next) => {
//     const myPayment = await stripe.paymentIntents.create({
//       amount: req.body.amount,
//       currency: "inr",
//       metadata: {
//         company: "Becodemy",
//       },
//     });
//     res.status(200).json({
//       success: true,
//       client_secret: myPayment.client_secret,
//     });
//   })
// );

router.post(
  "/process",
  catchAsyncErrors(async (req, res, next) => {
    console.log(req.body);
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      description: "Description of the export transaction",
      currency: "inr",
      shipping: {
        name: "demo",
        address: {
          line2 : "token.card.address_1",
          line1: "token.card.address_2",
          city: "se",
          country: "US",
          postal_code: "231123",
        },
      },
      metadata: {
        company: "Becodemy",
      },
    });
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  })
);

router.get(
  "/stripeapikey",
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
  })
);


module.exports = router;