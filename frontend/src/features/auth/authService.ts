import { supabase } from '../../services/supabase';
import type { AuthResponse, LoginRequest, RegisterRequest, Role, UserResponse } from '../../types';

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

function toUser(profile: ProfileRow): UserResponse {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    createdAt: profile.created_at,
  };
}

async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_at')
    .eq('id', userId)
    .single<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toUser(data);
}

function buildAuthResponse(token: string, user: UserResponse): AuthResponse {
  return {
    token,
    tokenType: 'Bearer',
    user,
  };
}

export async function login(payload: LoginRequest) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session || !data.user) {
    throw new Error('Login did not return a Supabase session.');
  }

  return buildAuthResponse(data.session.access_token, await getProfile(data.user.id));
}

export async function register(payload: RegisterRequest) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
        role: payload.role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Registration did not create a Supabase user.');
  }
  if (!data.session) {
    throw new Error('Registration succeeded, but email confirmation is enabled. Disable email confirmation in Supabase Auth settings for this demo, then register again.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return buildAuthResponse(data.session.access_token, await getProfile(data.user.id));
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    return null;
  }

  return getProfile(data.session.user.id);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
