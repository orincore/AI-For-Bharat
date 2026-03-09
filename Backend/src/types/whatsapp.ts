export interface WhatsAppNumber {
  id: string;
  userId: string;
  phoneNumber: string;
  displayName?: string;
  isVerified: boolean;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    lastUsed?: string;
    messageCount?: number;
  };
}
