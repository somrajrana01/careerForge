import { supabase } from '../../services/supabase';
import type { StudentProfile, StudentProfileRequest } from '../../types';

interface StudentProfileRow {
  id: string;
  user_id: string;
  branch: string;
  semester: number;
  cgpa: number;
  github_url: string | null;
  linkedin_url: string | null;
}

function toProfile(row: StudentProfileRow): StudentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    branch: row.branch,
    semester: row.semester,
    cgpa: row.cgpa,
    githubUrl: row.github_url ?? '',
    linkedinUrl: row.linkedin_url ?? '',
  };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('You must be signed in.');
  }
  return data.user.id;
}

export async function getProfile() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('student_profiles')
    .select('id, user_id, branch, semester, cgpa, github_url, linkedin_url')
    .eq('user_id', userId)
    .maybeSingle<StudentProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toProfile(data) : null;
}

export async function createProfile(payload: StudentProfileRequest) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('student_profiles')
    .insert({
      user_id: userId,
      branch: payload.branch,
      semester: payload.semester,
      cgpa: payload.cgpa,
      github_url: payload.githubUrl,
      linkedin_url: payload.linkedinUrl,
    })
    .select('id, user_id, branch, semester, cgpa, github_url, linkedin_url')
    .single<StudentProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toProfile(data);
}

export async function updateProfile(payload: StudentProfileRequest) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('student_profiles')
    .update({
      branch: payload.branch,
      semester: payload.semester,
      cgpa: payload.cgpa,
      github_url: payload.githubUrl,
      linkedin_url: payload.linkedinUrl,
    })
    .eq('user_id', userId)
    .select('id, user_id, branch, semester, cgpa, github_url, linkedin_url')
    .single<StudentProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toProfile(data);
}

export async function deleteProfile() {
  const userId = await currentUserId();
  const { error } = await supabase.from('student_profiles').delete().eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
