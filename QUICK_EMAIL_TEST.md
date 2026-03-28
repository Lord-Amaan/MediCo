# QUICK TEST GUIDE - Email Notifications

## 5-Minute Setup

```bash
# Step 1: Gmail 2FA Setup (one-time)
# → Go to myaccount.google.com/security
# → Enable 2-Step Verification
# → Go to myaccount.google.com/apppasswords
# → Generate password for "Mail" and "Windows"
# → Copy 16-character password

# Step 2: Configure .env
# Open: server/.env
# Change these lines:
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Step 3: Install nodemailer
cd server
npm install

# Step 4: Start server
npm run dev
```

---

## Verify Configuration (1 minute)

```bash
# Option A: Quick Config Check
node
> const emailService = require('./services/emailService');
> emailService.verifyEmailConfig();
# Look for: ✅ Email service is properly configured
# Or manually send test email:
> emailService.sendTestEmail('your-email@gmail.com');
# Check your inbox
```

---

## Full App Test (5 minutes)

**Open MediCo App and Follow These Steps:**

```
1. LOGIN as Sending Doctor
   └─ Email auto-captured from your profile

2. CREATE A TRANSFER
   ├─ Fill patient details
   ├─ Add critical info
   ├─ Pick receiving hospital
   └─ Submit

3. GO TO RECEIVING HOSPITAL
   ├─ Scan QR code
   ├─ View transfer details
   └─ Click "Acknowledge Transfer"

4. FILL ACKNOWLEDGEMENT FORM
   ├─ Check "Patient Verified"
   ├─ Add Arrival Notes (e.g., "Arrived in good condition")
   ├─ ADD DISCREPANCIES (REQUIRED):
   │  ├─ Example 1: "Patient reports medication X stopped 2 weeks ago"
   │  ├─ Example 2: "Allergy information differs from record"
   │  └─ At least one discrepancy needed for email
   └─ Click "Submit"

5. CHECK EMAIL INBOX
   ├─ Wait 3-5 seconds
   ├─ Email from: medico.app.notifications@gmail.com
   ├─ Subject: ⚠️ DISCREPANCIES REPORTED - Patient Transfer #XXXX
   ├─ Content shows:
   │  ├─ Patient identification
   │  ├─ Transfer path (From → To)
   │  ├─ Your discrepancies listed
   │  └─ Arrival notes from receiving doctor
   └─ SUCCESS! ✅
```

---

## Expected Output

### In Server Terminal

```
📧 Email notification: Sent
```

### In Email Inbox

```
From: medico.app.notifications@gmail.com
Subject: ⚠️ DISCREPANCIES REPORTED - Patient Transfer #TR20250124001

---

Dear Dr. [Sending Doctor Name],

A transfer acknowledgement has been received with DISCREPANCIES.

PATIENT INFORMATION
Name: John Doe
ID: MRN-123456
DOB: 15/06/1985

TRANSFER DETAILS
From: Sending Hospital
To: Receiving Hospital
Time Acknowledged: 24/01/2025 14:30:00
Acknowledged By: Dr. Receiving

NOTED DISCREPANCIES
1. Patient reports medication X stopped 2 weeks ago
2. Allergy information differs from record

ARRIVAL NOTES
Patient arrived in good condition. Vitals stable.

---

Please review the discrepancies and take appropriate action.
```

---

## Debugging Checklist

### Email Not Arriving?

```
✓ Check Spam Folder (Gmail marks auto-emails as spam sometimes)
✓ Verify EMAIL_USER in .env matches sending account
✓ Confirm 2FA is enabled on Gmail account
✓ Check that app password is 16 characters, no spaces
✓ Look for "Connection refused" in server logs (firewall issue)
✓ Check Gmail "Security" page for "Less secure app" block
✓ Verify transfer has discrepancies (no email if empty discrepancies)
```

### "Email notification: Failed" in Server?

```
❌ SMTP Auth Failed
   → Gmail app password is wrong
   → Fix: Regenerate app password, update .env

❌ Connection Timeout
   → Network/firewall blocking SMTP port 587
   → Fix: Check network, try different network if testing

❌ No Email Configured
   → EMAIL_USER or EMAIL_PASSWORD is missing/placeholder
   → Fix: Update .env with real credentials

❌ Doctor Email Missing
   → transfer.sendingFacility.doctorEmail is null
   → Fix: Ensure doctor user profile has valid email
```

---

## No Discrepancies = No Email (By Design)

```
This is INTENTIONAL - emails only sent when discrepancies exist

✅ Transfer acknowledged normally
   └─ NO EMAIL SENT (quiet success)

⚠️ Transfer acknowledged WITH discrepancies
   └─ EMAIL SENT (alerts doctor)
```

---

## Common Issues & Fixes

| Issue                                        | Cause                       | Fix                                    |
| -------------------------------------------- | --------------------------- | -------------------------------------- |
| "Invalid login"                              | App password instead of 2FA | Enable 2FA, generate app password      |
| Email won't send                             | PORT 587 blocked            | Use different network or VPN           |
| Wrong email address                          | EMAIL_USER typo in .env     | Verify and re-save .env                |
| Transfer created but no email field          | Module not loaded           | Restart: `npm run dev`                 |
| Email arrives with "to: doctor@hospital.com" | Fallback placeholder        | Ensure user has valid email in profile |

---

## Production Checklist

- [ ] Gmail credentials working in development
- [ ] Full email flow tested (create → ack → email)
- [ ] Email received within 5 seconds
- [ ] Rate limiting configured (if needed)
- [ ] Switch to SendGrid/AWS SES for production
- [ ] Update email from address to company domain
- [ ] Add SPF/DKIM records if using custom domain
- [ ] Monitor SMTP logs for delivery failures
- [ ] Backup email service configured
- [ ] Team trained on email notifications

---

## Quick Commands

```bash
# Start server with debug logging
npm run dev

# Check if nodemailer installed
npm list nodemailer

# Reinstall nodemailer if broken
npm install nodemailer@^6.9.7

# Check email config (inside Node REPL)
const es = require('./services/emailService');
es.verifyEmailConfig();

# Kill server
Ctrl+C
```

---

## Success Criteria ✅

- [ ] Email credentials configured in .env
- [ ] `npm install` completed successfully
- [ ] Server starts without errors: `npm run dev`
- [ ] Email verification passes: `emailService.verifyEmailConfig()`
- [ ] Test email received: `emailService.sendTestEmail('your-email@gmail.com')`
- [ ] Full app test: Create transfer → Acknowledge with discrepancies → Email received
- [ ] Email contains correct patient name, discrepancies list, and arrival notes

---

## Support

**If stuck:**

1. Check server logs for 📧 symbols
2. Run `verifyEmailConfig()` test
3. Review EMAIL_SETUP.md for detailed guide
4. Verify Gmail 2FA is enabled
5. Generate new app password

**Ready? Let's test!** 🚀
