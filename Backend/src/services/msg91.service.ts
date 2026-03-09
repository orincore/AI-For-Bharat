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
      
      // Normalize phone number - ensure it has + prefix
      const normalizedTo = to.startsWith('+') ? to : `+${to}`;
      
      const payload = {
        integrated_number: this.whatsappNumber,
        content_type: 'text',
        recipient_number: normalizedTo,
        text: message,
      };

      console.log(`📤 Sending WhatsApp message to ${normalizedTo}`);

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
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
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
      normalizedPayload.messageType ||
      firstMessage.type ||
      normalizedPayload.contentType ||
      'text';

    const textBodyRaw =
      normalizedPayload.text ||
      normalizedPayload.message ||
      (firstMessage?.text?.body ? firstMessage.text.body : null) ||
      normalizedPayload.caption;

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

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    // Prefer phone91.com URL from payload over lookaside URL from messages
    if (normalizedPayload.url && normalizedPayload.url.includes('phone91.com')) {
      mediaUrl = normalizedPayload.url;
      const contentType = normalizedPayload.contentType || messageType;
      if (contentType === 'image' || /image/i.test(contentType)) {
        mediaType = 'image';
      } else if (contentType === 'video' || /video/i.test(contentType)) {
        mediaType = 'video';
      }
    } else if (firstMessage.image) {
      mediaUrl = firstMessage.image.link || firstMessage.image.url;
      mediaType = 'image';
    } else if (firstMessage.video) {
      mediaUrl = firstMessage.video.link || firstMessage.video.url;
      mediaType = 'video';
    }

    // Fallback to payload.url if no media found yet
    if (!mediaUrl && normalizedPayload.url) {
      mediaUrl = normalizedPayload.url;
      const contentType = normalizedPayload.contentType || messageType;
      if (contentType === 'image' || /image/i.test(contentType)) {
        mediaType = 'image';
      } else if (contentType === 'video' || /video/i.test(contentType)) {
        mediaType = 'video';
      }
    }

    const fallbackText = mediaType ? `${mediaType === 'image' ? 'Image' : 'Video'} received` : '';
    const finalMessageText = (textBodyRaw && textBodyRaw.trim()) || fallbackText;

    if (!fromNumber || (!finalMessageText && !mediaUrl)) {
      return null;
    }

    // Extract media URL and type if present
    // (mediaUrl/mediaType already derived above)

    return {
      from: fromNumber,
      message: finalMessageText,
      messageType,
      messageId: messageId || normalizedPayload.ts || normalizedPayload.requestedAt || 'unknown-message-id',
      isInbound: true,
      mediaUrl,
      mediaType,
    };
  }

  validateWebhookSecret(headers: Record<string, any>): boolean {
    if (!this.webhookSecret) return true;
    const secretHeader = headers['x-webhook-secret'] || headers['X-Webhook-Secret'];
    return secretHeader === this.webhookSecret;
  }

  /**
   * Download media from MSG91 webhook (phone91.com URLs)
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
