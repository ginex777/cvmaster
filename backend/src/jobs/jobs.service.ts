import { BadRequestException, Injectable, RequestTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

export type JobParseInput =
  | { type: 'text'; value: string }
  | { type: 'url'; value: string }
  | { type: 'pdf'; value: string }
  | { type: 'screenshot'; value: string };

const MAX_JOB_TEXT_LENGTH = 20_000;
const MAX_URL_BYTES = 750_000;
const URL_TIMEOUT_MS = 8_000;

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parse(data: JobParseInput, userId: string) {
    const text = await this.fetchText(data);
    const sourceHash = createHash('sha256').update(text).digest('hex');

    const existing = await this.prisma.jobPosting.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const parsedJson = await this.ai.parseJob(text, { userId });

    return this.prisma.jobPosting.create({
      data: { userId, sourceType: data.type, sourceValue: data.value.slice(0, 2000), sourceHash, parsedJson },
    });
  }

  private async fetchText(data: JobParseInput): Promise<string> {
    switch (data.type) {
      case 'text':
        return this.normalizeJobText(data.value);
      case 'url':
        return this.fetchUrlText(data.value);
      case 'screenshot':
        throw new BadRequestException('Screenshot-Analyse ist erst nach der Sicherheitsfreigabe verfügbar.');
      case 'pdf':
        throw new BadRequestException('PDF-Stellenanzeigen sind erst nach der RAM-only Sicherheitsfreigabe verfügbar.');
      default:
        throw new BadRequestException('Unbekannter Eingabetyp für die Stellenanzeige.');
    }
  }

  private async fetchUrlText(value: string): Promise<string> {
    const url = this.parseSafeHttpUrl(value);
    await this.assertPublicHost(url.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'text/html, text/plain;q=0.9',
          'User-Agent': 'Hireflow AI Job Parser/1.0',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new ServiceUnavailableException('Stellenanzeige konnte unter dieser URL nicht geladen werden.');
      }

      const contentLength = Number(response.headers.get('content-length') ?? 0);
      if (contentLength > MAX_URL_BYTES) {
        throw new BadRequestException('Die Stellenanzeige ist zu groß. Bitte kopiere den Text direkt ein.');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
        throw new BadRequestException('Diese URL liefert keinen lesbaren Stellentext.');
      }

      return this.normalizeJobText(await this.readLimitedResponse(response));
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new RequestTimeoutException('URL-Abruf hat zu lange gedauert. Bitte kopiere den Stellentext direkt ein.');
      }
      throw new ServiceUnavailableException('Stellenanzeige konnte unter dieser URL nicht geladen werden.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSafeHttpUrl(value: string): URL {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('Bitte gib eine gültige URL zur Stellenanzeige ein.');
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new BadRequestException('Nur HTTP- und HTTPS-URLs sind erlaubt.');
    }

    if (url.username || url.password) {
      throw new BadRequestException('URLs mit Zugangsdaten werden nicht verarbeitet.');
    }

    return url;
  }

  private async assertPublicHost(hostname: string): Promise<void> {
    if (this.isBlockedHostname(hostname)) {
      throw new BadRequestException('Interne oder lokale URLs werden aus Sicherheitsgründen nicht verarbeitet.');
    }

    const entries = await lookup(hostname, { all: true, verbatim: true });
    if (entries.length === 0 || entries.some(entry => this.isPrivateAddress(entry.address))) {
      throw new BadRequestException('Interne oder lokale URLs werden aus Sicherheitsgründen nicht verarbeitet.');
    }
  }

  private isBlockedHostname(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    return lower === 'localhost' || lower.endsWith('.localhost') || this.isPrivateAddress(lower);
  }

  private isPrivateAddress(address: string): boolean {
    if (address === '::1') return true;

    if (isIP(address) === 4) {
      const [a = 0, b = 0] = address.split('.').map(part => Number(part));
      return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    }

    if (isIP(address) === 6) {
      const lower = address.toLowerCase();
      return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:');
    }

    return false;
  }

  private async readLimitedResponse(response: Response): Promise<string> {
    const body = response.body;
    if (!body) return '';

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_URL_BYTES) {
        throw new BadRequestException('Die Stellenanzeige ist zu groß. Bitte kopiere den Text direkt ein.');
      }
      text += decoder.decode(value, { stream: true });
    }

    return `${text}${decoder.decode()}`;
  }

  private normalizeJobText(value: string): string {
    const withoutNoise = value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
    const text = sanitizeHtml(withoutNoise, { allowedTags: [], allowedAttributes: {} })
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_JOB_TEXT_LENGTH);

    if (text.length < 50) {
      throw new BadRequestException('Bitte gib mindestens 50 Zeichen lesbaren Stellentext ein.');
    }

    return text;
  }
}
