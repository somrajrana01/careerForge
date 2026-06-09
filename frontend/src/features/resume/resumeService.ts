import { supabase } from '../../services/supabase';
import type { ResumeRecord, ResumeRequest } from '../../types';

interface ResumeRow {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

function toResume(row: ResumeRow): ResumeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    uploadedAt: row.uploaded_at,
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

export async function getResumes() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('resumes')
    .select('id, user_id, file_name, file_url, uploaded_at')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
    .returns<ResumeRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(toResume);
}

export async function createResume(payload: ResumeRequest) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      file_name: payload.fileName,
      file_url: payload.fileUrl,
    })
    .select('id, user_id, file_name, file_url, uploaded_at')
    .single<ResumeRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toResume(data);
}

export async function deleteResume(id: string) {
  const userId = await currentUserId();
  const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
