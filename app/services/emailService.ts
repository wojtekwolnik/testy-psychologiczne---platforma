import nodemailer from 'nodemailer';
import { getInternalBrandingSettings } from './settingsService';

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        const settings = await getInternalBrandingSettings();
        if (!settings || !settings.emailSettings?.enabled) {
            console.log('Email sending skipped: Disabled or no settings.');
            return { success: false, error: 'Email sending is disabled in settings' };
        }

        const { smtp, fromEmail, fromName } = settings.emailSettings;

        if (!smtp.host || !smtp.username) {
            console.error('Email sending failed: Incomplete SMTP settings.');
            return { success: false, error: 'Incomplete SMTP settings' };
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            // If port is 465, secure must be true. Otherwise let's use the explicit setting or default to false.
            secure: smtp.port === 465 ? true : !!smtp.secure,
            auth: {
                user: smtp.username,
                pass: smtp.password,
            },
        });

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });

        console.log('Email sent:', info.messageId);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendTherapistNotification(
    therapistEmail: string,
    therapistName: string,
    clientIdentifier: string,
    testTitle: string,
    reportLink: string
) {
    const settings = await getInternalBrandingSettings();
    if (!settings) return;

    const { therapistNotificationSubject, therapistNotificationBody, fromName } = settings.emailSettings;

    // Simple template replacement
    const subject = therapistNotificationSubject
        .replace(/{testTitle}/g, testTitle)
        .replace(/{clientIdentifier}/g, clientIdentifier);

    // Convert newlines to BR if needed, but the template is likely HTML.
    // We assume the user configures HTML or we wrap plain text.
    // For now, let's treat the body as HTML with simple replacements.
    const completionDate = new Date().toLocaleDateString('pl-PL');

    const htmlBody = therapistNotificationBody
        .replace(/{therapistName}/g, therapistName)
        .replace(/{clientIdentifier}/g, clientIdentifier)
        .replace(/{testTitle}/g, testTitle)
        .replace(/{completionDate}/g, completionDate)
        .replace(/{reportLink}/g, `<a href="${reportLink}">Zobacz Raport</a>`)
        .replace(/{appName}/g, settings.appName);

    await sendEmail({
        to: therapistEmail,
        subject,
        html: htmlBody,
    });
}
