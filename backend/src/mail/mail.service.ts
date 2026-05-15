import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

@Injectable()
export class MailService {
  private from = `Lebenslauf-Agent <noreply@${process.env.MAIL_DOMAIN}>`;

  async sendVerification(to: string, token: string) {
    const link = `${process.env.APP_URL}/api/auth/verify?token=${token}`;
    if (this.isDevMode()) {
      console.warn(`[dev-email] Verification link for ${to}: ${link}`);
      return;
    }

    await this.resend().emails.send({
      from: this.from,
      to,
      subject: 'E-Mail-Adresse bestätigen',
      html: `<p>Bitte bestätige deine E-Mail-Adresse: <a href="${link}">${link}</a></p>`,
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    await this.resend().emails.send({
      from: this.from,
      to,
      subject: 'Passwort zurücksetzen',
      html: `<p>Passwort zurücksetzen: <a href="${link}">${link}</a> (gültig 1h)</p>`,
    });
  }

  async sendApplicationToSelf(to: string, application: { id: string }, attachments: MailAttachment[]) {
    await this.resend().emails.send({
      from: this.from,
      to,
      subject: 'Deine Bewerbungsunterlagen',
      html: `<p>Deine optimierten Unterlagen wurden erstellt. Die PDFs findest du im Anhang.</p>`,
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
      tags: [{ name: 'applicationId', value: application.id }],
    });
  }

  async sendReminderNotification(to: string, application: { id: string; title: string; company: string }) {
    const link = `${process.env.APP_URL}/app/applications/${application.id}`;
    const subject = application.company
      ? `Erinnerung: Bewerbung bei ${application.company}`
      : `Erinnerung: ${application.title}`;
    const html = `<p>Du hast eine Erinnerung für deine Bewerbung gesetzt.</p><p><strong>${application.title}</strong>${application.company ? ` bei ${application.company}` : ''}</p><p><a href="${link}">Bewerbung öffnen</a></p>`;

    if (this.isDevMode()) {
      console.warn(`[dev-email] Reminder for ${to}: ${link}`);
      return;
    }

    await this.resend().emails.send({ from: this.from, to, subject, html });
  }

  async sendSecurityAlert(to: string, event: string) {
    await this.resend().emails.send({
      from: this.from,
      to,
      subject: `Sicherheitshinweis: ${event}`,
      html: `<p>Es wurde ein unbekannter Login von einer neuen Region erkannt. Falls du das nicht warst, ändere sofort dein Passwort.</p>`,
    });
  }

  private isDevMode(): boolean {
    return !process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'production';
  }

  private resend(): Resend {
    return new Resend(process.env.RESEND_API_KEY);
  }
}
