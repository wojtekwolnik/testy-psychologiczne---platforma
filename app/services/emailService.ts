import nodemailer from 'nodemailer';
import { getBrandingSettings } from '../actions/brandingActions';

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
        const settings = await getBrandingSettings();
        if (!settings || !settings.emailSettings?.enabled) {
            console.log('Email sending skipped: Disabled or no settings.');
            return false;
        }

        const { smtp, fromEmail, fromName } = settings.emailSettings;

        if (!smtp.host || !smtp.username) {
            console.error('Email sending failed: Incomplete SMTP settings.');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
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
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

export async function sendTherapistNotification(
    therapistEmail: string,
    therapistName: string,
    clientIdentifier: string,
    testTitle: string,
    reportLink: string
) {
    const settings = await getBrandingSettings();
    if (!settings) return;

    const { therapistNotificationSubject, therapistNotificationBody, fromName } = settings.emailSettings;

    // Simple template replacement
    const subject = therapistNotificationSubject
        .replace('{testTitle}', testTitle)
        .replace('{clientIdentifier}', clientIdentifier);

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
