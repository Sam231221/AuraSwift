# BBPOS WisePad 3 Hardware Setup Guide

## 🔌 Physical Connection

### 1. Connect the Device

- Connect BBPOS WisePad 3 to your computer via USB cable
- Ensure the device is powered on (LED indicators should be visible)
- The device should appear as a USB HID device

### 2. Driver Installation (if needed)

- **macOS**: Usually works out of the box
- **Windows**: May need BBPOS drivers from manufacturer
- **Linux**: Should work with standard HID drivers

### 3. Device Verification

Run this command to check if the device is detected:

```bash
# macOS/Linux
lsusb | grep -i bbpos

# Or check system report on macOS
system_profiler SPUSBDataType | grep -A 10 -i bbpos
```

## 🔧 Configuration Steps

### 1. Test USB Connection

```bash
cd /Users/admin/Documents/Developer/Electron/AuraSwift
node test-payment-service.js
```

### 2. Device Initialization

The payment service will automatically:

- Detect connected BBPOS devices
- Initialize communication protocols
- Set up card reading capabilities

### 3. Supported Payment Methods

- **Chip Cards**: Insert and wait for prompt
- **Contactless**: Tap cards/phones on reader
- **Magnetic Stripe**: Swipe cards (fallback method)

## 🧪 Testing Workflow

### 1. Basic Connection Test

```javascript
// This will list all detected USB devices
const readers = await paymentService.discoverReaders();
console.log("Found readers:", readers);
```

### 2. Card Reading Test

```javascript
// Start card reading session
const result = await paymentService.startCardReading({
  amount: 1000, // $10.00
  currency: "gbp",
});
```

### 3. Complete Transaction Test

1. Start the Electron app: `npm run dev`
2. Navigate to New Transaction
3. Add items to cart
4. Click "Card Payment"
5. Follow on-screen prompts
6. Test with different payment methods

## 🔍 Troubleshooting

### Device Not Detected

- Check USB connection
- Try different USB port
- Restart the device
- Check if device appears in system USB list

### Communication Errors

- Ensure no other software is using the device
- Check device permissions (especially on macOS)
- Restart the Electron app

### Payment Failures

- Verify Stripe account is active
- Check internet connection
- Ensure test cards are being used in test mode
- Review Stripe dashboard for error logs

## 🃏 Test Cards (Stripe Test Mode)

Use these test card numbers for development:

| Card Number      | Brand      | Description        |
| ---------------- | ---------- | ------------------ |
| 4242424242424242 | Visa       | Basic valid card   |
| 4000000000000002 | Visa       | Declined card      |
| 4000000000009995 | Visa       | Insufficient funds |
| 5555555555554444 | Mastercard | Basic valid card   |
| 378282246310005  | Amex       | Basic valid card   |

**Expiry**: Use any future date  
**CVC**: Use any 3-digit number  
**ZIP**: Use any valid ZIP code

## 📱 Live Production Setup

### When Ready for Live Payments:

1. Complete Stripe account verification
2. Switch to live API keys in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_your_live_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   ```
3. Test with real cards in small amounts
4. Configure webhook endpoints for production
5. Set up proper error monitoring

## 🔒 Security Considerations

- Never log card data
- Use HTTPS in production
- Keep Stripe keys secure
- Follow PCI compliance guidelines
- Regular security updates
