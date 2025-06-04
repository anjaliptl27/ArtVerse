"use strict";
/*
import { Request, Response } from 'express';
import stripe from 'stripe';
import Cart  from '../models/cartModel';
import Order from '../models/orderModel';

const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

export const paymentController = {
  // Create payment intent
  createPaymentIntent: async (req: Request, res: Response) => {
    try {
      const cart = await Cart.findOne({ userId: req.user?.userId });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate total amount
      const amount = cart.items.reduce((total, item) => total + item.price, 0);

      // Create payment intent
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          userId: req.user?.userId.toString(),
          cartId: cart._id.toString()
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount,
        currency: 'usd'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  },

  // Handle payment success webhook
  handlePaymentSuccess: async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, cartId } = paymentIntent.metadata;

      try {
        const cart = await Cart.findById(cartId);
        if (!cart) return;

        // Create order
        const order = new Order({
          buyerId: userId,
          items: cart.items.map(item => ({
            itemType: item.itemType,
            itemId: item.itemId,
            price: item.price
          })),
          total: paymentIntent.amount / 100,
          stripePaymentId: paymentIntent.id,
          status: 'completed'
        });

        await order.save();

        // Clear cart
        await Cart.findByIdAndUpdate(cartId, { $set: { items: [] } });

        // Here you would also:
        // 1. Mark artworks as sold
        // 2. Enroll student in courses
        // 3. Send notifications

      } catch (error) {
        console.error('Order creation error:', error);
      }
    }

    res.json({ received: true });
  }
};
*/ 
