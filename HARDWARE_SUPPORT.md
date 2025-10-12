# Hardware Support Guide - AuraSwift POS System

AuraSwift is a comprehensive Point of Sale (POS) system built with React and Electron, designed for supermarkets and retail environments. This document outlines the supported hardware devices for barcode scanning, receipt printing, and card payment processing.

## 📋 Table of Contents

- [Overview](#overview)
- [Barcode Scanners](#barcode-scanners)
- [Thermal Receipt Printers](#thermal-receipt-printers)
- [Card Payment Terminals](#card-payment-terminals)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Hardware Configuration](#hardware-configuration)
- [Troubleshooting](#troubleshooting)
- [Development & Testing](#development--testing)

## 🎯 Overview

AuraSwift supports professional-grade hardware commonly used in retail environments. All hardware integrations are designed for production use with proper error handling, queue management, and reconnection capabilities.

### Supported Hardware Categories:

- **Barcode Scanners**: USB HID keyboard emulation mode
- **Thermal Printers**: ESC/POS compatible printers via USB/Bluetooth
- **Card Readers**: BBPOS WisePad 3 with Stripe Terminal integration

## 🔍 Barcode Scanners

### Supported Scanner Types

AuraSwift supports **USB barcode scanners in keyboard emulation mode** (HID). This is the most common configuration for retail environments.

#### ✅ Compatible Scanner Models

- **Honeywell Voyager Series** (1200g, 1202g, 1400g, 1450g)
- **Symbol/Zebra LS Series** (LS2208, LS4208, DS2208, DS4208)
- **Datalogic QuickScan Series** (QD2430, QD2131)
- **Code CR Series** (CR1000, CR2600)
- **Any USB scanner supporting keyboard wedge/HID mode**

#### 📋 Scanner Features

- **Automatic Detection**: No driver installation required
- **Multi-Format Support**: UPC-A, UPC-E, EAN-8, EAN-13, Code 128, Code 39
- **Real-time Processing**: Instant barcode validation and product lookup
- **Audio Feedback**: Success/error beep sounds
- **Scan Logging**: Complete audit trail of all scanned items
- **Input Filtering**: Smart detection to avoid conflicts with keyboard input

#### 🔧 Scanner Configuration

```typescript
// Scanner configuration options
interface ScannerConfig {
  minBarcodeLength: 6; // Minimum valid barcode length
  maxBarcodeLength: 18; // Maximum valid barcode length
  scanTimeout: 200; // ms to wait for complete barcode
  enableAudio: true; // Audio feedback on scan
  ignoreInputs: true; // Ignore scans when typing in forms
}
```

#### 📝 Scanner Setup Steps

1. Connect USB scanner to computer
2. Ensure scanner is in **keyboard wedge/HID mode**
3. Test scanner in any text editor (should type characters)
4. Launch AuraSwift - scanner will be automatically detected

## 🖨️ Thermal Receipt Printers

### Supported Printer Types

AuraSwift uses **ESC/POS protocol** for thermal receipt printing with support for both USB and Bluetooth connectivity.

#### ✅ Compatible Printer Models

##### **USB Printers**

- **Epson TM Series**: TM-T20, TM-T82, TM-T88V, TM-T88VI
- **Star Micronics TSP Series**: TSP100, TSP143, TSP654
- **Citizen CT Series**: CT-S310A, CT-S4000
- **Bixolon SRP Series**: SRP-350, SRP-275III
- **Any ESC/POS compatible USB thermal printer**

##### **Bluetooth Printers**

- **Epson TM-P20**: Mobile receipt printer
- **Star SM-L200**: Portable receipt printer
- **Bixolon SPP-R200III**: Mobile thermal printer

#### 📋 Printer Features

- **ESC/POS Commands**: Full support for formatting, logos, barcodes
- **Auto-Detection**: Automatic printer discovery and connection
- **Print Queue**: Reliable queuing system for multiple receipts
- **Error Handling**: Automatic reconnection and retry logic
- **Receipt Templates**: Customizable receipt layouts
- **Logo Printing**: Support for business logos and graphics

#### 🔧 Printer Configuration

```typescript
// Printer configuration options
interface PrinterConfig {
  type: "epson" | "star" | "citizen" | "bixolon";
  interface: "usb" | "bluetooth";
  width: 80; // Receipt width (58mm or 80mm)
  characterSet: "CP437"; // Character encoding
  timeout: 5000; // Connection timeout (ms)
}
```

#### 📝 Printer Setup Steps

##### USB Setup:

1. Connect printer to USB port
2. Install printer drivers (if required by OS)
3. Power on printer and load receipt paper
4. Launch AuraSwift - printer will be auto-detected

##### Bluetooth Setup:

1. Enable Bluetooth on printer (refer to manual)
2. Pair printer with computer via OS Bluetooth settings
3. Note the Bluetooth address/port
4. Configure printer in AuraSwift settings
5. Test print connection

## 💳 Card Payment Terminals

### Supported Card Reader

AuraSwift integrates with **BBPOS WisePad 3** card readers through **Stripe Terminal** for secure payment processing.

#### ✅ Compatible Models

- **BBPOS WisePad 3**: Primary supported model
- **Connection Types**: USB, Bluetooth
- **Payment Methods**: Chip (EMV), Contactless (NFC), Magnetic stripe

#### 📋 Payment Features

- **Stripe Integration**: Secure payment processing via Stripe Terminal
- **EMV Compliance**: Full chip card support with PIN entry
- **Contactless Payments**: Apple Pay, Google Pay, contactless cards
- **Magnetic Stripe**: Fallback support for older cards
- **Real-time Status**: Battery level, connection monitoring
- **Error Recovery**: Automatic retry and reconnection logic
- **PCI Compliance**: Secure payment data handling

#### 🔧 Card Reader Configuration

```typescript
// Card reader configuration
interface CardReaderConfig {
  type: "bbpos_wisepad3";
  connectionType: "usb" | "bluetooth";
  deviceId?: string;
  simulated: false; // Set true for development/testing
}
```

#### 📝 Card Reader Setup Steps

##### USB Setup:

1. Connect WisePad 3 to USB port using provided cable
2. Install BBPOS drivers (if required)
3. Configure Stripe Terminal API keys in AuraSwift
4. Test card reader connection and payments

##### Bluetooth Setup:

1. Enable Bluetooth on WisePad 3 (hold power + 0)
2. Pair device with computer via OS Bluetooth settings
3. Configure device ID in AuraSwift settings
4. Test connection and payment processing

## 💻 System Requirements

### Operating System Support

- **Windows 10/11** (Primary platform)
- **macOS 10.15+** (Development/testing)
- **Linux Ubuntu 18.04+** (Development/testing)

### Hardware Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 500MB available space
- **USB Ports**: 2+ for scanner and printer
- **Bluetooth**: 4.0+ for wireless devices
- **Network**: Internet connection for payment processing

### Software Dependencies

- **Node.js**: 18+ (automatically managed)
- **Native Modules**:
  - `better-sqlite3`: Database operations
  - `node-hid`: USB device communication
  - `serialport`: Serial device communication
  - `usb`: Direct USB device access
  - `node-thermal-printer`: ESC/POS printing

## 🚀 Installation & Setup

### Quick Start

```bash
# Install AuraSwift
npm install

# Rebuild native modules for your platform
npm run postinstall

# Start the application
npm start
```

### Hardware Module Installation

Native hardware modules are automatically rebuilt during installation. If you encounter issues:

```bash
# Rebuild hardware-specific modules
npx electron-rebuild --only=better-sqlite3,node-hid,serialport,usb

# Or rebuild all modules
npx electron-rebuild
```

## ⚙️ Hardware Configuration

### Scanner Configuration

Navigate to **Settings → Hardware → Barcode Scanner**:

- Enable/disable scanner
- Set barcode length limits
- Configure audio feedback
- Test scanner functionality

### Printer Configuration

Navigate to **Settings → Hardware → Receipt Printer**:

- Select printer type and interface
- Configure paper width and character set
- Test print functionality
- Upload business logo

### Payment Terminal Configuration

Navigate to **Settings → Hardware → Payment Terminal**:

- Configure Stripe API keys
- Set card reader type and connection
- Test payment processing
- Configure receipt options

## 🔧 Troubleshooting

### Common Barcode Scanner Issues

#### Scanner Not Working

- ✅ Verify scanner is in keyboard emulation/HID mode
- ✅ Test scanner in text editor (should type characters)
- ✅ Check USB connection and try different port
- ✅ Restart AuraSwift application

#### Incomplete Barcode Scans

- ✅ Increase scan timeout in settings
- ✅ Check barcode quality and scanner distance
- ✅ Verify barcode format is supported
- ✅ Clean scanner lens

### Common Printer Issues

#### Printer Not Detected

- ✅ Check USB/Bluetooth connection
- ✅ Verify printer drivers installed (Windows)
- ✅ Ensure printer is powered on with paper loaded
- ✅ Restart printer and AuraSwift

#### Print Quality Issues

- ✅ Check paper alignment and quality
- ✅ Clean thermal print head
- ✅ Adjust print density settings
- ✅ Verify correct paper width setting

### Common Card Reader Issues

#### Connection Problems

- ✅ Check USB/Bluetooth pairing
- ✅ Verify BBPOS drivers installed
- ✅ Test with different USB port
- ✅ Check card reader battery level

#### Payment Processing Errors

- ✅ Verify Stripe API keys configuration
- ✅ Check internet connection
- ✅ Test with different payment method
- ✅ Review Stripe Dashboard for error details

## 🧪 Development & Testing

### Hardware Simulation Mode

For development without physical hardware:

```bash
# Start with hardware simulation
HARDWARE_SIMULATION_MODE=true npm start

# Enable specific mock devices
MOCK_PRINTER_ENABLED=true
MOCK_CARD_READER_ENABLED=true
MOCK_SCANNER_ENABLED=true
```

### Testing Hardware Integration

```bash
# Run hardware-specific tests
npm run test:hardware

# Run all tests including hardware
npm run test:all
```

### Development Environment Variables

```env
# Hardware simulation flags
HARDWARE_SIMULATION_MODE=true
MOCK_PRINTER_ENABLED=true
MOCK_CARD_READER_ENABLED=true
MOCK_SCANNER_ENABLED=true

# Stripe configuration (testing)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 📞 Support & Resources

### Documentation

- [Electron Hardware Integration Guide](./docs/hardware-integration.md)
- [ESC/POS Command Reference](./docs/escpos-commands.md)
- [Stripe Terminal Documentation](https://stripe.com/docs/terminal)

### Hardware Vendor Resources

- **BBPOS WisePad 3**: [Developer Portal](https://bbpos.com/developers)
- **Epson Printers**: [ESC/POS SDK](https://www.epson.com/pos-sdk)
- **Scanner Manufacturers**: Refer to device manual for HID mode setup

### Community & Issues

- Report hardware issues: [GitHub Issues](https://github.com/Sam231221/AuraSwift/issues)
- Feature requests: Use "hardware" label on issues
- Community discussions: [GitHub Discussions](https://github.com/Sam231221/AuraSwift/discussions)

---

**AuraSwift POS System** - Professional retail hardware integration made simple.

_Last updated: October 12, 2025_
