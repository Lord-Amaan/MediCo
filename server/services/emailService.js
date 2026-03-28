const nodemailer = require('nodemailer');

// ============================================================================
// EMAIL SERVICE - Send notifications on acknowledgements
// ============================================================================

// For development: Use Gmail with App Password or Ethereal test account
// For production: Use SendGrid, AWS SES, or similar service
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

const formatEmailError = (error) => {
  if (error?.responseCode === 535) {
    return 'Gmail authentication failed (535). Use a Gmail App Password (16 chars) with 2-Step Verification enabled.';
  }
  return error?.message || 'Unknown email error';
};

// ============================================================================
// SEND ACKNOWLEDGEMENT NOTIFICATION
// ============================================================================
exports.sendAcknowledgementNotification = async (transferData) => {
  try {
    if (!emailUser || !emailPassword) {
      return {
        success: false,
        error: 'EMAIL_USER/EMAIL_PASSWORD missing in environment.',
      };
    }

    const {
      patient,
      sendingDoctor,
      sendingFacility,
      receivingFacility,
      acknowledgement,
      transfer,
    } = transferData;

    // Only send if there are discrepancies (otherwise it's just a normal ack)
    if (!acknowledgement?.discrepancies || acknowledgement.discrepancies.length === 0) {
      console.log('ℹ️ No discrepancies - skipping notification');
      return;
    }

    // Build discrepancy list for email
    const discrepancyList = acknowledgement.discrepancies
      .map((disc, idx) => {
        if (typeof disc === 'string') {
          return `${idx + 1}. ${disc}`;
        }
        return `${idx + 1}. ${disc.issue || disc} (${disc.field || 'general'})`;
      })
      .join('\n');

    // Email content
    const emailSubject = `⚠️ DISCREPANCIES REPORTED - Patient Transfer #${transfer?.transferID || 'N/A'}`;

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ Transfer Acknowledgement with Discrepancies</h2>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin-top: 0;">Patient Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 8px;">${patient?.name || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">MRN:</td>
              <td style="padding: 8px; font-family: monospace;">${patient?.patientID || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Age:</td>
              <td style="padding: 8px;">${patient?.age || 'N/A'} years</td>
            </tr>
          </table>

          <h3 style="color: #1f2937; margin-top: 20px;">Transfer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">From:</td>
              <td style="padding: 8px;">${sendingFacility?.hospitalName || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">To:</td>
              <td style="padding: 8px;">${receivingFacility?.hospitalName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Time Acknowledged:</td>
              <td style="padding: 8px;">${new Date(acknowledgement?.acknowledgementTime).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">Acknowledged By:</td>
              <td style="padding: 8px;">${acknowledgement?.reviewedBy?.name || 'N/A'}</td>
            </tr>
          </table>

          <h3 style="color: #dc2626; margin-top: 20px;">📋 Noted Discrepancies</h3>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0;">
            <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: Arial;">${discrepancyList}</pre>
          </div>

          ${acknowledgement?.arrivalNotes ? `
            <h3 style="color: #1f2937; margin-top: 20px;">📝 Arrival Notes</h3>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0;">
              <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${acknowledgement.arrivalNotes}</p>
            </div>
          ` : ''}

          <h3 style="color: #059669; margin-top: 20px;">✅ What To Do</h3>
          <ol style="color: #374151;">
            <li>Review the discrepancies listed above</li>
            <li>Contact the receiving facility if clarification needed</li>
            <li>Update patient records if needed</li>
            <li>Monitor patient closely for any reported discrepancies</li>
          </ol>

          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; margin-top: 20px; border-radius: 8px;">
            <p style="margin: 0; color: #065f46; font-size: 12px;">
              <strong>This is an automated notification from MediCo.</strong><br>
              Transfer ID: ${transfer?.transferID || 'N/A'}<br>
              Time: ${new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `MediCo Alerts <${emailUser}>`,
      to: sendingDoctor?.email || 'doctor@hospital.com',
      subject: emailSubject,
      html: emailHTML,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const formattedError = formatEmailError(error);
    console.error('❌ Failed to send email:', formattedError);
    // Don't throw - let acknowledgement complete even if email fails
    return { success: false, error: formattedError };
  }
};

// ============================================================================
// TEST EMAIL SENDING
// ============================================================================
exports.sendTestEmail = async (recipientEmail) => {
  try {
    if (!emailUser || !emailPassword) {
      return {
        success: false,
        error: 'EMAIL_USER/EMAIL_PASSWORD missing in environment.',
      };
    }

    const info = await transporter.sendMail({
      from: `MediCo Alerts <${emailUser}>`,
      to: recipientEmail,
      subject: '🧪 MediCo Test Email',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Test Email from MediCo</h2>
          <p>If you received this, email notifications are working!</p>
          <p style="color: #6b7280; font-size: 12px;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
    });

    console.log('✅ Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const formattedError = formatEmailError(error);
    console.error('❌ Test email failed:', formattedError);
    return { success: false, error: formattedError };
  }
};

// ============================================================================
// VERIFY EMAIL CONFIG
// ============================================================================
exports.verifyEmailConfig = async () => {
  try {
    if (!emailUser || !emailPassword) {
      return {
        success: false,
        error: 'EMAIL_USER/EMAIL_PASSWORD missing in environment.',
      };
    }

    await transporter.verify();
    console.log('✅ Email service verified and ready');
    return { success: true };
  } catch (error) {
    const formattedError = formatEmailError(error);
    console.error('❌ Email service verification failed:', formattedError);
    return { success: false, error: formattedError };
  }
};
