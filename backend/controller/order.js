const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Ewallet = require("../model/e-wallet");
const Shop = require("../model/shop");
const Product = require("../model/product");
const PDFDocument = require('pdfkit');
const nodemailer = require("nodemailer");
const fs = require('fs');

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


      pdfDoc.fontSize(12);
      pdfDoc.font('Helvetica-Bold').text('Bill of Purchase', { align: 'center' }).font('Helvetica');
      pdfDoc.moveDown();

      // Add order details
      for (const order of orders) {
        pdfDoc.font('Helvetica-Bold').text(`Order ID: ${order._id}`).font('Helvetica');
        pdfDoc.text(`Shipping Address: ${shippingAddress.address1}, ${shippingAddress.address2}, ${shippingAddress.zipCode}, ${shippingAddress.city}, ${shippingAddress.country}`);
        pdfDoc.text(`Total Price: ${totalPrice}`);
        pdfDoc.moveDown();

        // Add products as a table
        let tableTop = pdfDoc.y + 10; // Adjust top position
        const tableBottom = pdfDoc.page.height - 50; // Adjust bottom position
        const col1Start = 50; // Adjust left position for column 1
        const col2Start = 250; // Adjust left position for column 2
        const col3Start = 400; // Adjust left position for column 3

        // Draw table headers
        pdfDoc.font('Helvetica-Bold').text('Product', col1Start, tableTop);
        pdfDoc.font('Helvetica-Bold').text('Quantity', col2Start, tableTop);
        pdfDoc.font('Helvetica-Bold').text('Price', col3Start, tableTop);

        // Move down cursor
        pdfDoc.moveDown();

        // Iterate through each product
        for (const item of order.cart) {
          // Move down cursor and check if there's enough space for the next row
          if (pdfDoc.y >= tableBottom) {
            pdfDoc.addPage(); // Add a new page if there's not enough space
            tableTop = 50; // Adjust top position for new page
          }

          // Draw product details
          pdfDoc.text(item.name, col1Start, pdfDoc.y);
          pdfDoc.text(item.quantity !== undefined ? item.quantity.toString() : '', col2Start, pdfDoc.y);
          pdfDoc.text(item.price !== undefined ? item.price.toString() : '', col3Start, pdfDoc.y);

          // Move down cursor
          pdfDoc.moveDown();
        }

        pdfDoc.moveDown();
      }

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

        seller.availableBalance = amount;

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
