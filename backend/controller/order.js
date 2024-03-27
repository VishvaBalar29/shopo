const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Ewallet = require("../model/e-wallet");
const Shop = require("../model/shop");
const Product = require("../model/product");
const nodemailer = require("nodemailer");
const PDFDocument = require('pdfkit');
const fs = require('fs');
// const { PDFTable } = require('pdfkit-table');
// create new order
router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      // Group cart items by shopId
      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      const pdfDoc = new PDFDocument();
      const pdfFilePath = `bill_${Date.now()}.pdf`;
      pdfDoc.pipe(fs.createWriteStream(pdfFilePath));
      pdfDoc.fontSize(12).text('Bill of Purchase\n\n');

      console.log(orders);
      // Add bill details based on the order data
      pdfDoc.text(`Order ID: ${orders[0]._id}`);
      pdfDoc.text(`Shipping Address: ${shippingAddress.address1}, ${shippingAddress.address2}, ${shippingAddress.zipCode},${shippingAddress.city},${shippingAddress.country}`);
      pdfDoc.text('\nProducts:');
      let total_amt = 0;
      for (const order of orders) {

        for (const item of order.cart) {
          pdfDoc.font('Helvetica-Bold').text(`Name  :    ${item.name}`, { align: 'left' });
          pdfDoc.text(`Quantity  :   ${item.qty}`, {  align: 'left' });
          pdfDoc.text(`Original Price  :   ${item.originalPrice}`, { align: 'left' });
          pdfDoc.text(`Discount Price   :   ${item.discountPrice}`, { align: 'left' });
          total_amt = total_amt + item.discountPrice;
          pdfDoc.moveDown();
        }
        pdfDoc.text('\n');
      }
      shipping_charge = total_amt * 10 / 100;
      pdfDoc.text(`Price: ${total_amt}`,{ align: 'right' });
      pdfDoc.text(`Shipping Charges : ${shipping_charge}`,{ align: 'right' });
      pdfDoc.text(`Total Price : ${totalPrice}`,{ align: 'right' });
    

      pdfDoc.end();

      // Send confirmation email with pdf
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'vishubalar29@gmail.com',
          pass: 'fwth uxqn jpne cppu'
        }
      });

      const mailOptions = {
        from: 'vishubalar29@gmail.com',
        to: user.email,
        subject: `Order Confirmation & Bill for ${user.name}`,
        html: `<h2>Your order has been confirmed. Thank you for shopping with us!</h2>`,
        attachments: [{
          filename: 'bill.pdf',
          path: pdfFilePath
        }]
      };

      transporter.sendMail(mailOptions, function (error, info) {
        fs.unlinkSync(pdfFilePath);

        if (error) {
          console.error('Error sending email:', error);
          return res.status(400).json({ message: "Error sending email with bill attached" });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({
          success: true,
          orders,
        });
      });
    } catch (error) {
      console.log(error);
      // return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * .10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);

        seller.availableBalance += amount;

        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;


      await order.save({ validateBeforeSave: false });


      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;
      await order.save();

      const checkEwallet = await Ewallet.findOne({ userId: order.user._id })
      if (checkEwallet) {
        const money = (checkEwallet.amount + order.totalPrice).toFixed(2);
        await Ewallet.updateOne({ userId: order.user._id }, { $set: { amount: money } });
      }
      else {
        const ewalletData = await Ewallet.create({
          orderId: order._id,
          userId: order.user._id,
          username: order.user.name,
          amount: order.totalPrice
        });
        console.log(ewalletData);
      }


      res.status(200).json({
        success: true,
        message: "Order Refund successfull!",
      });

      if (req.body.status === "Refund Success") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock += qty;
        product.sold_out -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all orders --- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
