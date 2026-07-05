export type MediaJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface MediaJob {
  id:                string;
  uploader_id:       string;
  original_filename: string;
  status:            MediaJobStatus;
  error_message:     string | null;
  duration_seconds:  number | null;
  hls_url:           string | null;
  created_at:        Date;
  updated_at:        Date;
}

export interface JwtPayload {
  sub:  string;
  role: string;
  [key: string]: unknown;
}

export interface TranscodeJobData {
  mediaJobId: string;
  inputPath:  string;
}
