# Supported Thermal Receipt Printers - Quick Reference

## 🖨️ **WIRED (USB) PRINTERS** ✅

### **Epson Models** (Primary Support)

| Model    | Type         | Width     | Notes                             |
| -------- | ------------ | --------- | --------------------------------- |
| TM-T20   | USB          | 80mm      | Entry-level, widely available     |
| TM-T82   | USB          | 80mm      | Standard retail printer           |
| TM-T88V  | USB          | 80mm      | **Most common in POS systems** ⭐ |
| TM-T88VI | USB/Ethernet | 80mm      | Latest generation                 |
| TM-m10   | USB          | 58mm/80mm | Compact, mobile-ready             |
| TM-m30   | USB/Ethernet | 80mm      | Space-saving design               |

### **Star Micronics Models**

| Model  | Type                | Width | Notes                          |
| ------ | ------------------- | ----- | ------------------------------ |
| TSP100 | USB                 | 80mm  | Popular budget option          |
| TSP143 | USB                 | 80mm  | High-speed printing            |
| TSP654 | USB/Serial/Ethernet | 80mm  | Multi-interface                |
| TSP650 | USB/Serial          | 80mm  | Older but reliable             |
| mPOP   | USB                 | 58mm  | Combined printer + cash drawer |

### **Citizen Models**

| Model    | Type                | Width | Notes            |
| -------- | ------------------- | ----- | ---------------- |
| CT-S310A | USB                 | 80mm  | Compact design   |
| CT-S4000 | USB/Ethernet        | 80mm  | High performance |
| CT-E651  | USB/Ethernet/Serial | 80mm  | Triple interface |

### **Bixolon Models**

| Model      | Type | Width | Notes                    |
| ---------- | ---- | ----- | ------------------------ |
| SRP-350    | USB  | 80mm  | Standard receipt printer |
| SRP-275III | USB  | 80mm  | Compact size             |

### **Generic Brands**

- ✅ **DIERI** USB thermal printers
- ✅ Any **ESC/POS compatible** USB printer
- ✅ Most generic receipt printers with USB interface

---

## 📡 **WIRELESS (BLUETOOTH) PRINTERS** ✅

### **Mobile/Portable Models**

| Model        | Brand   | Width | Battery | Notes                    |
| ------------ | ------- | ----- | ------- | ------------------------ |
| **DIERI BT** | DIERI   | 58mm  | Yes     | **Explicitly tested** ⭐ |
| TM-P20       | Epson   | 58mm  | Yes     | Popular mobile printer   |
| TM-P80       | Epson   | 80mm  | Yes     | Advanced mobile with NFC |
| SM-L200      | Star    | 58mm  | Yes     | Compact portable         |
| SM-L300      | Star    | 80mm  | Yes     | Rugged, weatherproof     |
| SPP-R200III  | Bixolon | 58mm  | Yes     | Lightweight mobile       |
| SPP-R400     | Bixolon | 104mm | Yes     | Wide format mobile       |

### **Bluetooth Requirements:**

- Bluetooth 2.0 or higher
- Serial Port Profile (SPP) support
- Must be paired with computer via OS Bluetooth settings
- MAC address format: `BT:XX:XX:XX:XX:XX:XX`
- Recommended range: ≤10 meters for stable connection

---

## ⚙️ **CONFIGURATION EXAMPLES**

### **USB Connection (Windows):**

```typescript
{
  type: "epson",
  interface: "COM3",  // Check Device Manager
  options: {
    timeout: 5000,
    characterSet: "CP437"
  }
}
```

### **USB Connection (macOS):**

```typescript
{
  type: "epson",
  interface: "/dev/tty.usbserial-XXXXXXXX",  // Check with ls -la /dev/tty.*
  options: {
    timeout: 5000,
    characterSet: "CP437"
  }
}
```

### **Bluetooth Connection:**

```typescript
{
  type: "epson",
  interface: "COM5",  // Bluetooth COM port (Windows)
  // OR
  interface: "/dev/tty.printer-SerialPort",  // macOS
  // OR
  interface: "BT:00:11:62:AA:BB:CC",  // Direct MAC address
  options: {
    timeout: 5000,
    characterSet: "CP437"
  }
}
```

---

## 🎯 **RECOMMENDED MODELS**

### **For Fixed POS Stations:**

| Priority | Model              | Why                               |
| -------- | ------------------ | --------------------------------- |
| 🥇 1st   | **Epson TM-T88VI** | Industry standard, reliable, fast |
| 🥈 2nd   | Star TSP143        | Cost-effective, high speed        |
| 🥉 3rd   | Citizen CT-S4000   | High performance alternative      |

### **For Mobile/Portable Use:**

| Priority | Model            | Why                            |
| -------- | ---------------- | ------------------------------ |
| 🥇 1st   | **Epson TM-P20** | Lightweight, long battery life |
| 🥈 2nd   | DIERI BT         | Budget-friendly, tested        |
| 🥉 3rd   | Star SM-L200     | Compact, reliable              |

---

## 🔧 **PAPER SPECIFICATIONS**

### **58mm Printers:**

- Paper width: 58mm (2.25 inches)
- Characters per line: **32 characters**
- Best for: Mobile, compact setups

### **80mm Printers:**

- Paper width: 80mm (3.15 inches)
- Characters per line: **48 characters**
- Best for: Fixed POS stations, detailed receipts

---

## ✅ **COMPATIBILITY MATRIX**

| Feature          | USB     | Bluetooth  | Notes                     |
| ---------------- | ------- | ---------- | ------------------------- |
| ESC/POS Commands | ✅      | ✅         | Full support              |
| Auto-detection   | ✅      | ⚠️         | BT requires pairing first |
| Print Queue      | ✅      | ✅         | Managed by software       |
| Paper Cut        | ✅      | ✅         | If printer supports       |
| Graphics/Logos   | ✅      | ✅         | ESC/POS compatible        |
| Character Sets   | ✅      | ✅         | CP437, CP850, etc.        |
| Connection Speed | ⚡ Fast | 🐢 Slower  | USB more reliable         |
| Setup Complexity | 🟢 Easy | 🟡 Medium  | BT needs pairing          |
| Production Ready | ✅ Yes  | ⚠️ Testing | USB recommended           |

---

## 🚫 **NOT SUPPORTED**

- ❌ Inkjet printers
- ❌ Laser printers
- ❌ Non-ESC/POS thermal printers
- ❌ Printers without USB/Bluetooth
- ❌ WiFi-only printers (no direct support)
- ❌ Parallel port printers

---

## 🆘 **QUICK TROUBLESHOOTING**

| Problem              | Solution                                  |
| -------------------- | ----------------------------------------- |
| Printer not detected | Check USB cable, drivers, COM port        |
| Bluetooth won't pair | Enable BT on printer, update drivers      |
| Prints blank         | Check paper orientation (thermal side)    |
| Garbled text         | Try different character set (CP437/CP850) |
| Connection timeout   | Increase timeout to 10000ms               |
| Queue stuck          | Restart app or call cancelPrint()         |

---

## 📞 **VENDOR SUPPORT**

### **Epson:**

- Website: epson.com/pos
- Support: epson.com/support
- SDK: epson.com/pos-sdk

### **Star Micronics:**

- Website: starmicronics.com
- Support: starmicronics.com/support
- SDK: starmicronics.com/sdk

### **Citizen:**

- Website: citizen-systems.com
- Support: citizen-systems.com/support

### **Bixolon:**

- Website: bixolon.com
- Support: bixolon.com/support

---

## 📚 **DOCUMENTATION**

For detailed information, see:

- **PRINTER_TESTING_GUIDE.md** - Complete testing procedures
- **PRINTER_INTEGRATION_SUMMARY.md** - Technical overview
- **HARDWARE_SUPPORT.md** - Full hardware documentation

---

**Last Updated:** October 17, 2025  
**Library:** node-thermal-printer v4.5.0  
**Platform:** Windows 10/11 (Primary), macOS, Linux
