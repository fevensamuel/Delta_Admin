import { apiClient, StorageService } from './client';
import { User } from '../types';

let failedLoginAttempts = 0;
let lastFailedAttemptTime = 0;

export async function loginApi(usernameOrEmail: string, password: string): Promise<{ token: string; user: User }> {
  // Check rate limiting (e.g. max 5 attempts in 1 minute)
  const now = Date.now();
  if (failedLoginAttempts >= 5 && now - lastFailedAttemptTime < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - lastFailedAttemptTime)) / 1000);
    throw new Error(`Too many failed login attempts. Please wait ${remainingSeconds} seconds before trying again.`);
  }

  try {
    const res = await apiClient.post('/api/admin/login', { username: usernameOrEmail, password });
    failedLoginAttempts = 0;
    return res.data?.data || res.data;
  } catch {
    // Local / offline fallback
    const users = StorageService.getUsers();
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    
    // Allow matching by username or email
    const foundUser = users.find(
      (u) => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) && (u.isActive ?? u.status === 'Active')
    );

    if (foundUser && password.length >= 4) {
      failedLoginAttempts = 0;
      // Generate a realistic JWT token format mock
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: foundUser.id, role: foundUser.role }))}.mockSignature12345`;
      
      // Update last login
      foundUser.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 16);
      StorageService.setUsers(users);

      return {
        token: mockToken,
        user: foundUser
      };
    } else {
      failedLoginAttempts++;
      lastFailedAttemptTime = Date.now();
      throw new Error('Invalid username/email or password credentials');
    }
  }
}

export async function getProfileApi(): Promise<User> {
  try {
    const res = await apiClient.get('/api/admin/me');
    return res.data?.data || res.data;
  } catch {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('admin_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    throw new Error('Unauthorized');
  }
}
