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
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'production') {
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

  async sendSecurityAlert(to: string, event: string) {
    await this.resend().emails.send({
      from: this.from,
      to,
      subject: `Sicherheitshinweis: ${event}`,
      html: `<p>Es wurde ein unbekannter Login von einer neuen Region erkannt. Falls du das nicht warst, ändere sofort dein Passwort.</p>`,
    });
  }

  private resend(): Resend {
    return new Resend(process.env.RESEND_API_KEY);
  }
}
