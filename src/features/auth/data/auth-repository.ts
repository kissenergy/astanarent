import { apiRequest, clearAuthToken, saveAuthToken } from '../../../shared/api/api-client';
import { normalizeKzPhone } from '../../../shared/lib/phone';
import { Profile, UserRole } from '../../../shared/types/database';

type SignUpParams = {
  email?: string;
  name: string;
  phone: string;
  password: string;
};

type SignInParams = {
  phone: string;
  password: string;
};

type AuthResponse = {
  user: Profile;
  token: string;
};

export async function signUpWithEmail({ email, name, phone, password }: SignUpParams) {
  const normalizedPhone = normalizeKzPhone(phone);
  if (!normalizedPhone) {
    throw new Error('Введите корректный номер Казахстана');
  }

  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: {
      name,
      phone: normalizedPhone,
      email: email?.trim() ? email.trim().toLowerCase() : undefined,
      password,
    },
  });

  await saveAuthToken(data.token);
  return data;
}

export async function signInWithEmail({ phone, password }: SignInParams) {
  const normalizedPhone = normalizeKzPhone(phone);
  if (!normalizedPhone) {
    throw new Error('Введите корректный номер Казахстана');
  }

  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: {
      phone: normalizedPhone,
      password,
    },
  });

  await saveAuthToken(data.token);
  return data;
}

export async function signOut() {
  await clearAuthToken();
}

export async function getMe() {
  return apiRequest<Profile>('/auth/me', { authenticated: true });
}

export async function updateMe(payload: { name?: string; phone?: string; email?: string | null }) {
  return apiRequest<Profile>('/auth/me', {
    method: 'PATCH',
    authenticated: true,
    body: payload,
  });
}

export async function getAdminUsers() {
  return apiRequest<Profile[]>('/admin/users', { authenticated: true });
}

export async function setAdminUserRole(userId: string, role: UserRole) {
  return apiRequest<Profile>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    authenticated: true,
    body: { role },
  });
}

export async function setAdminUserAdmin(userId: string, isAdmin: boolean) {
  return apiRequest<Profile>(`/admin/users/${userId}/admin`, {
    method: 'PATCH',
    authenticated: true,
    body: { isAdmin },
  });
}
