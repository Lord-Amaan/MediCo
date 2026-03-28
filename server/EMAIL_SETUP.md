# Email Notifications Setup Guide

## Overview

The MediCo app sends email notifications to the sending doctor when a transfer acknowledgement includes discrepancies. This guide explains how to set up the email service.

---

## Prerequisites

- Node.js 14+
- npm or yarn
- Gmail account (for development) OR SendGrid/AWS SES account (for production)

---

## Development Setup (Gmail)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Sign in with your Gmail account
3. Enable "2-Step Verification"

### Step 2: Generate Gmail App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password

### Step 3: Configure Environment Variables

1. Open `.env` file in the server directory:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Step 4: Install Dependencies

```bash
cd server
npm install
```

### Step 5: Start the Server

```bash
npm run dev
```

---

## How Email Notifications Work

### Trigger

Email is sent when:

1. A transfer is received by a hospital
2. The receiving team acknowledges the transfer
3. **Discrepancies are found** (optional field in acknowledgement form)

### Email Content

The email includes:

- Patient name, ID, and date of birth
- Transfer details (from hospital → to hospital)
- **Discrepancies list** (what was different from expected)
- Arrival notes from receiving doctor
- Call-to-action button to review full transfer details

### Recipient

- **To:** Sending doctor's email (captured when transfer is created)
- **From:** MediCo notifications account
- **Subject:** "⚠️ DISCREPANCIES REPORTED - Patient Transfer #XXXX"

---

## Database Fields

### Transfer Model Update

Added field to `sendingFacility` object:

```javascript
doctorEmail: String; // Email for sending acknowledgement notifications
```

### When Data is Captured

- **Email captured:** When transfer is created (from logged-in user's email)
- **Discrepancies stored:** When receiving team acknowledges transfer
- **Email sent:** When acknowledgement includes discrepancies

---

## Testing Email Functionality

### Manual Test (In App)

1. Create a new transfer in the app
2. Scan QR code at destination hospital
3. Submit acknowledgement with at least one discrepancy
4. Check the sending doctor's email inbox
5. Email should arrive within 5 seconds

### Programmatic Test

Use the test utility in emailService.js:

```bash
node
> const emailService = require('./services/emailService');
> emailService.sendTestEmail('recipient@gmail.com');
```

### Debug Email Configuration

```bash
> emailService.verifyEmailConfig();
```

Should show: `✅ Email service is properly configured`

---

## Production Setup (SendGrid)

### Step 1: Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key from Settings → API Keys

### Step 2: Update emailService.js

Replace the transporter configuration:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

### Step 3: Update .env

```
EMAIL_USER=noreply@medico.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

---

## Troubleshooting

### Emails Not Sending

- ✅ Check `NODE_ENV=development` in .env
- ✅ Verify Gmail app password (16 chars, no spaces)
- ✅ Check "Less Secure Apps" if using regular Gmail password
- ✅ Check doctor email is populated in transfer.sendingFacility.doctorEmail

### 2-FA Error

- Gmail will reject any plain password
- Must use 16-character app-specific password only

### Email with Placeholder Domain

- Check that `EMAIL_USER` is set correctly in .env
- Placeholder value: if not configured, falls back to `'doctor@hospital.com'` (development only)

### SMTP Connection Timeout

- Gmail might block from new IP addresses
- Check for verification prompt in Gmail inbox
- Or use SendGrid/AWS SES for production

---

## Code References

### emailService.js (180 lines)

- `sendAcknowledgementNotification()` - Main function
- `sendTestEmail()` - Test utility
- `verifyEmailConfig()` - Configuration check

### transferController.js (Lines 411-420)

Email trigger on discrepancies in `acknowledgeTransfer()` function

### Transfer Model (models/Transfer.js)

- Line ~95: `sendingFacility.doctorEmail` field

### .env Configuration

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## Security Notes

⚠️ **IMPORTANT:**

- Never commit `.env` file to Git
- App passwords are single-use per application
- Regenerate credentials at least annually
- Use SendGrid/AWS SES for production (more secure)
- Consider rate limiting for email sending

---

## Support

For issues with email setup:

1. Check console logs in server terminal (look for 📧 symbols)
2. Run `verifyEmailConfig()` to test connectivity
3. Review Gmail security settings at myaccount.google.com/security
4. Check spam folder in receiving email account
