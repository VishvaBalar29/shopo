const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const Withdraw = require("../model/withdraw");
const Ewallet = require("../model/e-wallet")
const router = express.Router();


// get all withdraws --- admnin

router.get(
  "/get-Ewallets",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const EwalletData = await Ewallet.find();

      res.status(201).json({
        success: true,
        EwalletData,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


module.exports = router;
