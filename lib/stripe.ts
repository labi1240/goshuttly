import Stripe from "stripe";

// Fallback to a dummy key during build time to prevent build-time evaluation from failing
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build"
);
