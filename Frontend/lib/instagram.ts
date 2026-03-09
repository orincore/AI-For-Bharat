const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface InstagramAccount {
  id: string;
  platformAccountId: string;
  platformUsername: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
}

export const instagramService = {
  async connectAccount(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/instagram/connect`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      data.data.authUrl,
      'Instagram OAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );
  },

  async getConnectedAccounts(): Promise<InstagramAccount[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/instagram/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    return data.data;
  },

  async disconnectAccount(accountId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/instagram/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },

  async setActiveAccount(accountId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/instagram/accounts/${accountId}/activate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },
};
