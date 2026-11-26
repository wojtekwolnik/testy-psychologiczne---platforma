import nodemailer from 'nodemailer';
import { getInternalBrandingSettings } from './settingsService';
import { escapeHtmlText } from '@/lib/testUtils';

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

        if (!smtp.host || !smtp.username || !smtp.password) {
            console.log('Email sending skipped: Incomplete SMTP credentials (host, username or password missing).');
            return { success: false, error: 'Niepełna konfiguracja SMTP (uzupełnij host, użytkownika i hasło w Ustawieniach Platformy).' };
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
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

    const { therapistNotificationSubject, therapistNotificationBody } = settings.emailSettings;

    const subject = therapistNotificationSubject
        .replace(/{testTitle}/g, testTitle)
        .replace(/{clientIdentifier}/g, clientIdentifier);

    const completionDate = new Date().toLocaleDateString('pl-PL');

    const htmlBody = therapistNotificationBody
        .replace(/{therapistName}/g, escapeHtmlText(therapistName))
        .replace(/{clientIdentifier}/g, escapeHtmlText(clientIdentifier))
        .replace(/{testTitle}/g, escapeHtmlText(testTitle))
        .replace(/{completionDate}/g, escapeHtmlText(completionDate))
        .replace(/{reportLink}/g, `<a href="${encodeURI(reportLink)}">Zobacz Raport</a>`)
        .replace(/{appName}/g, escapeHtmlText(settings.appName));

    await sendEmail({
        to: therapistEmail,
        subject,
        html: htmlBody,
    });
}
