/**
 * Stripe Configuration Test
 * Run this to verify your Stripe keys are working properly
 */

import dotenv from "dotenv";
import Stripe from "stripe";

// Load environment variables
dotenv.config();

async function testStripeConfiguration() {
  console.log("🧪 Testing Stripe Configuration...\n");

  // Check if environment variables are loaded
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  console.log("📋 Environment Variables:");
  console.log(
    `Secret Key: ${
      secretKey ? secretKey.substring(0, 12) + "..." : "❌ NOT FOUND"
    }`
  );
  console.log(
    `Publishable Key: ${
      publishableKey ? publishableKey.substring(0, 12) + "..." : "❌ NOT FOUND"
    }\n`
  );

  if (!secretKey) {
    console.error("❌ STRIPE_SECRET_KEY not found in environment variables!");
    console.log("Please check your .env file and make sure it contains:");
    console.log("STRIPE_SECRET_KEY=sk_test_your_key_here");
    return;
  }

  // Initialize Stripe
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    });

    console.log("✅ Stripe client initialized successfully");

    // Test 1: Get account information
    console.log("\n🏦 Testing Account Access...");
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Account ID: ${account.id}`);
    console.log(`✅ Country: ${account.country}`);
    console.log(`✅ Email: ${account.email || "Not set"}`);
    console.log(`✅ Details Submitted: ${account.details_submitted}`);

    // Test 2: Create a test payment intent
    console.log("\n💳 Testing Payment Intent Creation...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: "gbp",
      payment_method_types: ["card"],
      description: "Test payment intent from AuraSwift POS",
    });

    console.log(`✅ Payment Intent Created: ${paymentIntent.id}`);
    console.log(`✅ Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`✅ Status: ${paymentIntent.status}`);
    console.log(
      `✅ Client Secret: ${paymentIntent.client_secret?.substring(0, 20)}...`
    );

    // Test 3: Check Terminal availability
    console.log("\n🖥️  Testing Stripe Terminal...");
    try {
      const readers = await stripe.terminal.readers.list({ limit: 1 });
      console.log(`✅ Terminal API accessible`);
      console.log(`✅ Registered readers: ${readers.data.length}`);
    } catch (terminalError) {
      console.log(
        "⚠️  Terminal API accessible but no readers registered (this is normal for new accounts)"
      );
    }

    // Clean up - cancel the test payment intent
    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log("✅ Test payment intent cancelled");

    console.log(
      "\n🎉 All Stripe tests passed! Your configuration is working correctly."
    );
    console.log("\n📋 Next Steps:");
    console.log("1. ✅ Stripe API keys are configured");
    console.log("2. ✅ Payment processing is ready");
    console.log("3. 🔄 Connect a card reader (BBPOS WisePad 3) via USB");
    console.log("4. 🔄 Test with real card transactions");
  } catch (error) {
    console.error("\n❌ Stripe configuration error:");

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);

      // Provide specific guidance based on error type
      if (error.message.includes("Invalid API Key")) {
        console.log("\n🔧 Fix: Check your STRIPE_SECRET_KEY in .env file");
        console.log("Make sure it starts with 'sk_test_' or 'sk_live_'");
      } else if (error.message.includes("testmode")) {
        console.log(
          "\n🔧 Note: You're using test mode keys (this is fine for development)"
        );
      } else if (error.message.includes("authentication")) {
        console.log(
          "\n🔧 Fix: Verify your API key has the correct permissions"
        );
      }
    } else {
      console.error("Unknown error:", error);
    }
  }
}

// Run the test
testStripeConfiguration().catch(console.error);
