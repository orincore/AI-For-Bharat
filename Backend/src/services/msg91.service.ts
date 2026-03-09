import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: string;
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
}

interface InboundWebhookPayload {
  customer_number: string;
  content: any;
  message_type: string;
  direction: string;
  integrated_number: string;
  message_uuid: string;
  text?: string;
  template_name?: string;
  status?: string;
}

export class MSG91Service {
  private authKey: string;
  private whatsappNumber: string;
  private baseUrl: string;
  private webhookSecret?: string;

  constructor() {
    this.authKey = PLATFORM_CONFIG.MSG91.AUTH_KEY || '';
    this.whatsappNumber = PLATFORM_CONFIG.MSG91.WHATSAPP_NUMBER || '';
    this.baseUrl = PLATFORM_CONFIG.MSG91.BASE_URL;
    this.webhookSecret = PLATFORM_CONFIG.MSG91.WEBHOOK_SECRET;

    if (!this.authKey || !this.whatsappNumber) {
      console.warn('⚠️ MSG91 credentials not configured');
    }
  }

  /**
   * Send a text message via WhatsApp (requires active session)
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/whatsapp/whatsapp-outbound-message/`;
      
      const payload = {
        integrated_number: this.whatsappNumber,
        content_type: 'text',
        payload: {
          to,
          type: 'text',
          text: message,
        },
      };

      console.log(`📤 Sending WhatsApp message to ${to}`);

      const response = await axios.post(url, payload, {
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ WhatsApp message sent successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a template message via WhatsApp (to initiate conversation)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'en',
    components?: any[]
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/whatsapp/whatsapp-outbound-message/`;
      
      const payload = {
        integrated_number: this.whatsappNumber,
        content_type: 'template',
        payload: {
          to,
          type: 'template',
          template: {
            name: templateName,
            language,
            components: components || [],
          },
        },
      };

      console.log(`📤 Sending WhatsApp template message to ${to}`);

      const response = await axios.post(url, payload, {
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ WhatsApp template sent successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp template:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Parse inbound webhook payload from MSG91
   */
  parseInboundMessage(payload: InboundWebhookPayload | Record<string, any>): {
    from: string;
    message: string;
    messageType: string;
    messageId: string;
    isInbound: boolean;
  } | null {
    const direction = (payload as any).direction;
    if (direction && direction !== 'inbound') {
      return null;
    }

    const normalizedPayload: Record<string, any> = payload as any;
    const rawMessages = normalizedPayload.messages;
    let parsedMessages: any[] = [];
    if (rawMessages) {
      try {
        if (typeof rawMessages === 'string') {
          parsedMessages = JSON.parse(rawMessages);
        } else if (Array.isArray(rawMessages)) {
          parsedMessages = rawMessages;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse MSG91 messages array:', error);
      }
    }

    const firstMessage = parsedMessages[0] || {};
    const messageType =
      normalizedPayload.message_type ||
      normalizedPayload.messageType ||
      firstMessage.type ||
      normalizedPayload.contentType ||
      'text';

    const textBody =
      normalizedPayload.text ||
      normalizedPayload.content?.text ||
      firstMessage.text?.body ||
      firstMessage.message ||
      '';

    const fromNumber =
      normalizedPayload.customer_number ||
      normalizedPayload.customerNumber ||
      firstMessage.from ||
      normalizedPayload.customer_number ||
      normalizedPayload.customerNumber;

    const messageId =
      normalizedPayload.message_uuid ||
      normalizedPayload.uuid ||
      firstMessage.id ||
      normalizedPayload.requestId ||
      normalizedPayload.request_id ||
      normalizedPayload.messageId;

    if (!fromNumber || !textBody) {
      return null;
    }

    return {
      from: fromNumber,
      message: textBody,
      messageType,
      messageId: messageId || normalizedPayload.ts || normalizedPayload.requestedAt || 'unknown-message-id',
      isInbound: true,
    };
  }

  validateWebhookSecret(headers: Record<string, any>): boolean {
    if (!this.webhookSecret) return true;
    const secretHeader = headers['x-webhook-secret'] || headers['X-Webhook-Secret'];
    return secretHeader === this.webhookSecret;
  }

  /**
   * Download media from MSG91 webhook (if media URL provided)
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          'authkey': this.authKey,
        },
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ Failed to download media:', error.message);
      throw error;
    }
  }

  /**
   * Get list of templates configured for this WhatsApp number
   */
  async getTemplates(): Promise<any> {
    try {
      const url = `${this.baseUrl}/whatsapp/template/list`;
      
      const response = await axios.get(url, {
        headers: {
          'authkey': this.authKey,
        },
        params: {
          integrated_number: this.whatsappNumber,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const msg91Service = new MSG91Service();
