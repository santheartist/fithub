/**
 * API client for making requests to backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIClient {
  client: AxiosInstance;
  private refreshTokenPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If data is FormData, remove Content-Type so browser sets it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    // Handle 401 responses with automatic token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If it's a 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh the token
            const newAccessToken = await this.attemptTokenRefresh();

            if (newAccessToken) {
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              // Retry the original request
              return this.client(originalRequest);
            } else {
              // Refresh failed, redirect to login
              this.clearTokens();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } catch (refreshError) {
            // Refresh error, redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async attemptTokenRefresh(): Promise<string | null> {
    // If a refresh is already in progress, wait for it
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // Create a promise that will be shared across concurrent requests
    this.refreshTokenPromise = (async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        this.setTokens(access_token, newRefreshToken);
        return access_token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  // Auth endpoints
  async register(username: string, email: string, password: string, bio?: string) {
    return this.client.post('/auth/register', {
      username,
      email,
      password,
      bio,
    });
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async refreshToken(refreshToken: string) {
    return this.client.post('/auth/refresh', { refresh_token: refreshToken });
  }

  // User endpoints
  async getCurrentUser() {
    return this.client.get('/users/me');
  }

  async updateProfile(bio?: string, profilePictureUrl?: string) {
    return this.client.put('/users/me', { bio, profile_picture_url: profilePictureUrl });
  }

  async getUserProfile(userId: number) {
    return this.client.get(`/users/${userId}`);
  }

  // Paper endpoints
  async getPapersFeed(skip: number = 0, limit: number = 20, category?: string) {
    const params: any = { skip, limit };
    if (category) params.category = category;
    return this.client.get('/papers', { params });
  }

  async searchPapers(query: string, category?: string, sortBy?: string, skip: number = 0, limit: number = 20) {
    const params: any = { q: query, skip, limit };
    if (category) params.category = category;
    if (sortBy) params.sort_by = sortBy;
    return this.client.get('/papers/search', { params });
  }

  async getPaperDetail(paperId: number) {
    return this.client.get(`/papers/${paperId}`);
  }

  async createPaper(paper: any) {
    return this.client.post('/papers', paper);
  }

  async likePaper(paperId: number) {
    return this.client.post(`/papers/${paperId}/like`);
  }

  async unlikePaper(paperId: number) {
    return this.client.delete(`/papers/${paperId}/like`);
  }

  async savePaper(paperId: number) {
    return this.client.post(`/user/saved-papers/${paperId}`);
  }

  async unsavePaper(paperId: number) {
    return this.client.delete(`/user/saved-papers/${paperId}`);
  }

  async getSavedPapers(skip: number = 0, limit: number = 20, category?: string) {
    const params: any = { skip, limit };
    if (category) params.category = category;
    return this.client.get('/user/saved-papers', { params });
  }

  async isPaperSaved(paperId: number) {
    return this.client.get(`/user/saved-papers/${paperId}/is-saved`);
  }

  async repostPaper(paperId: number) {
    return this.client.post(`/user/reposts/${paperId}`);
  }

  async unrepostPaper(paperId: number) {
    return this.client.delete(`/user/reposts/${paperId}`);
  }

  async getUserReposts(skip: number = 0, limit: number = 20, category?: string) {
    const params: any = { skip, limit };
    if (category) params.category = category;
    return this.client.get('/user/reposts', { params });
  }

  async isPaperReposted(paperId: number) {
    return this.client.get(`/user/reposts/${paperId}/is-reposted`);
  }

  async getUserActivityFeed(skip: number = 0, limit: number = 20) {
    return this.client.get('/user/activity-feed', { params: { skip, limit } });
  }

  // Profile endpoints
  async getProfile(userId: number) {
    return this.client.get(`/profile/${userId}`);
  }

  async getMyProfile() {
    return this.client.get('/profile/me/profile');
  }

  async updateProfileSettings(data: any) {
    return this.client.put('/profile/me/settings', data);
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.client.post('/profile/me/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/profile/me/upload-picture', formData);
  }

  async uploadBannerPicture(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/profile/me/upload-banner', formData);
  }

  async deleteAccount(password: string) {
    return this.client.delete('/profile/me/account', {
      data: { password },
    });
  }

  // Comment endpoints
  async getPaperComments(paperId: number) {
    return this.client.get(`/papers/${paperId}/comments`);
  }

  async createComment(paperId: number, content: string, parentCommentId?: number) {
    return this.client.post(`/papers/${paperId}/comments`, {
      content,
      parent_comment_id: parentCommentId,
    });
  }

  async deleteComment(paperId: number, commentId: number) {
    return this.client.delete(`/papers/${paperId}/comments/${commentId}`);
  }

  async likeComment(paperId: number, commentId: number) {
    return this.client.post(`/papers/${paperId}/comments/${commentId}/like`);
  }

  async unlikeComment(paperId: number, commentId: number) {
    return this.client.delete(`/papers/${paperId}/comments/${commentId}/like`);
  }

  // Report endpoints
  async createReport(reportType: string, description?: string, paperId?: number, commentId?: number) {
    return this.client.post('/reports', {
      report_type: reportType,
      description,
      paper_id: paperId,
      comment_id: commentId,
    });
  }

  // AI endpoints
  async chatAboutPaper(paperId: number, message: string) {
    return this.client.post(`/papers/${paperId}/chat`, {
      message,
    });
  }

  async getPaperConversations(paperId: number) {
    return this.client.get(`/papers/${paperId}/conversations`);
  }

  async getConversation(conversationId: number) {
    return this.client.get(`/conversations/${conversationId}`);
  }

  async deleteConversation(conversationId: number) {
    return this.client.delete(`/conversations/${conversationId}`);
  }

  async getPaperSummary(paperId: number, style: string = 'balanced') {
    return this.client.post(`/papers/${paperId}/summary`, {
      style,
    });
  }

  async analyzeTrends(category?: string, limit: number = 5) {
    const params: any = { limit };
    if (category) params.category = category;
    return this.client.post('/papers/analyze/trends', {}, { params });
  }

  async comparePapers(paperIds: number[]) {
    return this.client.post('/papers/compare', {
      paper_ids: paperIds,
    });
  }

  async getResearchQuestions(paperId: number) {
    return this.client.get(`/papers/${paperId}/research-questions`);
  }
}

export const apiClient = new APIClient();
