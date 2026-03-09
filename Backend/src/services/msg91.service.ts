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

  constructor() {
    this.authKey = PLATFORM_CONFIG.MSG91.AUTH_KEY || '';
    this.whatsappNumber = PLATFORM_CONFIG.MSG91.WHATSAPP_NUMBER || '';
    this.baseUrl = PLATFORM_CONFIG.MSG91.BASE_URL;

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
  parseInboundMessage(payload: InboundWebhookPayload): {
    from: string;
    message: string;
    messageType: string;
    messageId: string;
    isInbound: boolean;
  } | null {
    // Only process inbound messages
    if (payload.direction !== 'inbound') {
      return null;
    }

    return {
      from: payload.customer_number,
      message: payload.text || payload.content?.text || '',
      messageType: payload.message_type,
      messageId: payload.message_uuid,
      isInbound: true,
    };
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
