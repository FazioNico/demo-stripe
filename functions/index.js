/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
// const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");
const { STRIPE_APIKEY } = require("./env.config");

const stripeSecretKey = STRIPE_APIKEY; // defineSecret("STRIPE_SECRET_KEY");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

exports.createStripeSession = onRequest(
  { cors: true },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const stripe = new Stripe(stripeSecretKey);
      const origin = request.get("origin") || "http://localhost:5173";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "chf",
              unit_amount: 2000,
              product_data: { name: "Demo purchase" },
            },
          },
        ],
        success_url: `${origin}/?payment=success`,
        cancel_url: `${origin}/?payment=cancelled`,
      });

      response.json({ url: session.url });
    } catch (error) {
      logger.error("Stripe session creation failed", error);
      response.status(500).json({ error: "Unable to create Stripe session" });
    }
  },
);

exports.createStripeSubscriptionSession = onRequest(
  { cors: true },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const productId = request.query.id;

    if (!productId) {
      response.status(404).send("Product not found");
      return;
    }

    try {
      const stripe = new Stripe(stripeSecretKey);
      const origin = request.get("origin") || "http://localhost:5173";

      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        type: "recurring",
        limit: 1,
      });

      if (prices.data.length === 0) {
        logger.error("No active recurring price for product", { productId });
        response.status(404).json({ error: "No recurring price found" });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        allow_promotion_codes: true,
        line_items: [{ price: prices.data[0].id, quantity: 1 }],
        success_url: `${origin}/?subscription=success&session_id={CHECKOUT_SESSION_ID}`, // {CHECKOUT_SESSION_ID} coming form Stripe
        cancel_url: `${origin}/?subscription=cancelled`,
      });

      response.json({ url: session.url });
    } catch (error) {
      logger.error("Stripe subscription session creation failed", error);
      response.status(500).json({
        error: "Unable to create Stripe subscription session",
      });
    }
  },
);
