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

router.put(
  "/update-Ewallets/:id/:money",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const id = req.params.id;
      const remainingMoney = req.params.money;
      const data = await Ewallet.findOne({userId:id});
      if(remainingMoney == 0){
        await Ewallet.deleteOne({userId:id});
      }else{
        const updateData = await Ewallet.updateOne({userId:id},{$set:{amount:remainingMoney}});
      }
      res.status(201).json({
        success: true
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


module.exports = router;
