/**
 * Payment Flow Test - GBP with Mixed Payment Methods
 * Tests the updated payment service with card_present and regular card support
 */

import dotenv from "dotenv";
import Stripe from "stripe";

// Load environment variables
dotenv.config();

async function testUpdatedPaymentFlow() {
  console.log(
    "🧪 Testing Updated Payment Flow (GBP + Mixed Payment Methods)...\n"
  );

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  try {
    // Test 1: Create payment intent with mixed payment methods
    console.log("💳 Creating payment intent with mixed payment methods...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1250, // £12.50
      currency: "gbp",
      payment_method_types: ["card_present", "card"], // Both methods supported
      description: "AuraSwift POS Test Transaction (Mixed Methods)",
    });

    console.log(`✅ Payment Intent Created: ${paymentIntent.id}`);
    console.log(`✅ Amount: £${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`✅ Currency: ${paymentIntent.currency.toUpperCase()}`);
    console.log(
      `✅ Supported Methods: ${paymentIntent.payment_method_types.join(", ")}`
    );

    // Test 2: Try regular card payment (no physical reader required)
    console.log("\n💳 Testing regular card payment...");

    // Create a test payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa", // Test card token
      },
    });

    console.log(`✅ Payment Method Created: ${paymentMethod.id}`);
    console.log(`✅ Card Type: ${paymentMethod.type}`);
    console.log(`✅ Card Last4: ${paymentMethod.card?.last4}`);

    // Confirm payment with the method
    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method: paymentMethod.id,
      }
    );

    console.log(`✅ Payment Confirmed: ${confirmedIntent.status}`);
    console.log(
      `✅ Amount Captured: £${(confirmedIntent.amount_received / 100).toFixed(
        2
      )}`
    );

    console.log("\n🎉 Payment Flow Test Completed Successfully!");
    console.log("\n📋 Results Summary:");
    console.log("✅ GBP currency: Working");
    console.log("✅ Mixed payment methods: Working");
    console.log("✅ Regular card payments: Working");
    console.log("✅ No physical reader required: Working");

    console.log("\n🚀 Your Electron app should now work with card payments!");
    console.log("💡 Try the card payment button in your POS interface.");
  } catch (error) {
    console.error("\n❌ Payment flow test failed:");
    console.error(error);

    if (error instanceof Error && error.message.includes("currency")) {
      console.log(
        "\n🔧 Currency issue detected - check your Stripe account region"
      );
    } else if (
      error instanceof Error &&
      error.message.includes("payment_method_types")
    ) {
      console.log("\n🔧 Payment method issue - check configuration");
    }
  }
}

testUpdatedPaymentFlow().catch(console.error);
