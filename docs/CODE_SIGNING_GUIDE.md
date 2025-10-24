# Code Signing Guide for AuraSwift

## Why You're Seeing Security Warnings

Your users are seeing two security warnings:

### 1. Chrome Download Warning

```
auraswift-1.1.0-win-x64.exe isn't commonly downloaded.
Make sure you trust auraswift-1.1.0-win-x64.exe before you open it.
```

### 2. Windows SmartScreen Warning

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.
```

**Root Cause**: Your application is **UNSIGNED** - it has no digital certificate proving it comes from a verified publisher.

---

## What is Code Signing?

Code signing is the process of digitally signing executables with a certificate that proves:

- ✅ The software comes from you (verified identity)
- ✅ The software hasn't been tampered with since signing
- ✅ You are a legitimate software publisher

**Result**: Windows and browsers trust your app immediately - no warnings!

---

## How to Get a Code Signing Certificate

### Option 1: **SSL.com** (Recommended - $199/year)

- **Cost**: $199/year for EV Code Signing Certificate
- **Delivery**: USB token shipped to you
- **Identity Verification**: Business or individual verification required
- **Link**: https://www.ssl.com/certificates/ev-code-signing/

**Pros**: Immediate trust, no SmartScreen reputation building needed
**Cons**: More expensive, requires hardware token

### Option 2: **Sectigo** ($119/year)

- **Cost**: $119/year for Standard Code Signing Certificate
- **Delivery**: Digital certificate file
- **Identity Verification**: Email + phone verification
- **Link**: https://www.sectigo.com/ssl-certificates-tls/code-signing

**Pros**: Cheaper, easier to manage
**Cons**: Requires building SmartScreen reputation (takes time)

### Option 3: **DigiCert** ($474/year)

- **Cost**: $474/year for EV Code Signing Certificate
- **Delivery**: USB token
- **Identity Verification**: Full business verification
- **Link**: https://www.digicert.com/signing/code-signing-certificates

**Pros**: Most trusted brand, best for enterprises
**Cons**: Most expensive option

### Option 4: **SignPath.io** (Free for Open Source)

- **Cost**: FREE for verified open-source projects
- **Type**: Automated cloud signing
- **Requirements**: Public GitHub repo with open-source license
- **Link**: https://about.signpath.io/product/open-source

**Pros**: Completely free for OSS projects
**Cons**: Only for open-source, requires approval

---

## Verification Process (Typical Timeline)

1. **Purchase Certificate**: Select vendor and purchase
2. **Identity Verification**: 2-7 days
   - Business documents (if company)
   - Government ID (if individual)
   - Phone verification
   - Address verification
3. **Certificate Issuance**: 1-2 days
4. **Receive Token/Certificate**: 3-5 days shipping (if hardware token)

**Total Time**: 1-2 weeks

---

## Configuring electron-builder for Code Signing

Once you have your certificate, update `electron-builder.mjs`:

### For Windows (with certificate file)

```javascript
export default {
  appId: "com.auraswift.app",
  productName: "AuraSwift",

  // ... existing config ...

  win: {
    target: [
      { target: "nsis", arch: ["x64", "ia32"] },
      { target: "portable", arch: ["x64"] },
    ],

    // CODE SIGNING CONFIGURATION
    certificateFile: "./certificates/code-signing-cert.pfx", // Path to your .pfx file
    certificatePassword: process.env.CSC_KEY_PASSWORD, // Password from environment variable

    // IMPORTANT: For production, use environment variables
    // certificateFile: process.env.CSC_LINK,
    // certificatePassword: process.env.CSC_KEY_PASSWORD,

    signingHashAlgorithms: ["sha256"], // Use SHA-256 (modern standard)
    rfc3161TimeStampServer: "http://timestamp.digicert.com", // Timestamp server (keeps signature valid after cert expires)
  },

  // ... rest of config ...
};
```

### Environment Variables (Recommended for Security)

**DO NOT commit certificates to Git!** Use environment variables:

```bash
# .env (add to .gitignore!)
CSC_LINK=/path/to/your/certificate.pfx
CSC_KEY_PASSWORD=your-certificate-password
```

Update `electron-builder.mjs`:

```javascript
import dotenv from "dotenv";
dotenv.config();

export default {
  // ...
  win: {
    certificateFile: process.env.CSC_LINK,
    certificatePassword: process.env.CSC_KEY_PASSWORD,
    signingHashAlgorithms: ["sha256"],
    rfc3161TimeStampServer: "http://timestamp.digicert.com",
  },
  // ...
};
```

### For macOS (with Apple Developer Certificate)

```javascript
export default {
  // ...
  mac: {
    identity: "Developer ID Application: Your Name (TEAM_ID)",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "./build/entitlements.mac.plist",
    entitlementsInherit: "./build/entitlements.mac.plist",
  },

  afterSign: "./scripts/notarize.js", // For notarization (required for macOS)
  // ...
};
```

---

## GitHub Actions Integration (Automated Signing)

Add certificate secrets to GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `CSC_LINK`: Base64-encoded certificate file
   - `CSC_KEY_PASSWORD`: Certificate password

Update `.github/workflows/release.yml`:

```yaml
- name: Compile Electron with Code Signing
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.CSC_LINK }} # Certificate file (base64)
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }} # Certificate password
  run: |
    npm run compile:win
```

**Encoding certificate for GitHub Secrets:**

```bash
# Encode .pfx file to base64
base64 -i code-signing-cert.pfx -o cert-base64.txt

# Copy contents of cert-base64.txt to GitHub secret CSC_LINK
```

---

## Verifying Your Signed Application

After signing, verify the signature:

### Windows Verification

```powershell
# Check signature details
Get-AuthenticodeSignature "AuraSwift Setup 1.1.0.exe" | Format-List

# Expected output:
# Status        : Valid
# SignerCertificate : CN=Your Company Name, ...
# TimeStamperCertificate : CN=DigiCert SHA2 Assured ID Timestamping CA, ...
```

**Manual Check**:

1. Right-click `.exe` file → **Properties**
2. Go to **Digital Signatures** tab
3. Should show your certificate details

### macOS Verification

```bash
# Check code signature
codesign -dv --verbose=4 AuraSwift.app

# Check notarization
spctl -a -vvv -t install AuraSwift.app
```

---

## SmartScreen Reputation Building

Even with a **Standard Code Signing Certificate** (not EV), you may still see SmartScreen warnings initially:

### Why?

- Microsoft SmartScreen builds **reputation over time**
- New certificates have no reputation yet
- SmartScreen tracks: downloads, install rate, user feedback

### How Long?

- **EV Certificate**: ✅ Immediate trust (no reputation needed)
- **Standard Certificate**: ⏱️ 2-12 weeks to build reputation
  - Requires: 100-1000+ downloads with good user behavior
  - No uninstalls, no malware reports, stable usage

### Accelerate Reputation:

1. Use **EV Certificate** ($199-$474/year) for instant trust
2. Encourage early adopters to download and use the app
3. Avoid frequent certificate changes (damages reputation)
4. Submit your app to Microsoft for review (optional)

---

## Cost-Benefit Analysis

| Option             | Cost/Year | Setup Time | Instant Trust? | Best For        |
| ------------------ | --------- | ---------- | -------------- | --------------- |
| **No Signing**     | $0        | 0 min      | ❌ No          | Testing only    |
| **Standard Cert**  | $119-$199 | 1-2 weeks  | ⏱️ 2-12 weeks  | Budget projects |
| **EV Certificate** | $199-$474 | 1-2 weeks  | ✅ Immediate   | Commercial apps |
| **SignPath (OSS)** | $0        | 1 week     | ✅ Immediate   | Open-source     |

---

## Recommendation for AuraSwift

Based on your POS system being a commercial application:

### **Best Choice: SSL.com EV Code Signing Certificate ($199/year)**

**Why?**

1. ✅ **Immediate Trust**: No SmartScreen warnings from day 1
2. ✅ **Professional**: Shows "Verified Publisher" in dialogs
3. ✅ **Customer Confidence**: Customers trust signed software
4. ✅ **Reasonable Cost**: $199/year is manageable for commercial app
5. ✅ **Auto-Updates Work**: Signed updates install without warnings

**Investment**: $199/year = $16.58/month = Small price for professional credibility

---

## Current State vs. After Signing

### Before Signing (Current)

```
❌ Chrome: "This file isn't commonly downloaded"
❌ Windows: "Windows protected your PC" (blocks by default)
❌ Users must click "Keep" → "More info" → "Run anyway"
❌ Looks suspicious to customers
❌ Auto-updates may get blocked by antivirus
```

### After Signing with EV Certificate

```
✅ Chrome: Downloads without warning
✅ Windows: Installs without SmartScreen warning
✅ Shows your company name as verified publisher
✅ Users trust the installation process
✅ Auto-updates install seamlessly
✅ Professional appearance for commercial software
```

---

## Action Steps

1. **Immediate**: Add note to download page explaining security warnings

   ```
   "Windows may show a security warning because this is a new application.
    Click 'More info' → 'Run anyway' to install. We are working on code signing."
   ```

2. **This Week**: Research certificate options (SSL.com, Sectigo, DigiCert)

3. **Next Week**: Purchase EV Code Signing Certificate from SSL.com

4. **After Verification (1-2 weeks)**: Configure electron-builder with certificate

5. **Build Signed Release**: Release v1.1.1 with code signature

6. **Verify**: Test that no warnings appear on fresh Windows install

7. **Update Documentation**: Remove warning note once app is signed

---

## Support Resources

- **electron-builder Code Signing**: https://www.electron.build/code-signing
- **SSL.com Support**: https://www.ssl.com/how-to/
- **Windows SmartScreen**: https://docs.microsoft.com/en-us/windows/security/threat-protection/microsoft-defender-smartscreen/
- **SignPath Documentation**: https://about.signpath.io/documentation/

---

## Questions?

**Q: Can I test signing locally?**  
A: Yes, but self-signed certificates still trigger warnings. You need a CA-issued certificate.

**Q: Will this work for macOS too?**  
A: No, macOS requires a separate Apple Developer certificate ($99/year).

**Q: Can I sign old releases retroactively?**  
A: No, you must rebuild and re-release with the certificate.

**Q: What if my certificate expires?**  
A: Timestamped signatures remain valid forever, even after cert expires.

---

## Conclusion

**For a professional POS system like AuraSwift**, code signing is essential:

- Builds customer trust
- Eliminates scary security warnings
- Enables seamless auto-updates
- Shows you're a legitimate software vendor

**Investment**: $199/year for EV certificate is a small cost for the professional credibility it provides.

**Next Step**: Purchase SSL.com EV Code Signing Certificate and follow the configuration steps above.
