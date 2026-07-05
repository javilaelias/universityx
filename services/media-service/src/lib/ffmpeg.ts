import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { join } from 'path';

export interface TranscodeResult {
  durationSeconds: number;
}

// Transcodifica a un único rendition HLS (720p, H.264/AAC) — MVP sin adaptive bitrate.
export function transcodeToHls(inputPath: string, outputDir: string): Promise<TranscodeResult> {
  mkdirSync(outputDir, { recursive: true });
  const playlistPath = join(outputDir, 'index.m3u8');
  const segmentPath  = join(outputDir, 'seg_%03d.ts');

  const args = [
    '-y',
    '-i', inputPath,
    '-vf', 'scale=-2:720,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'main', '-crf', '20',
    '-sc_threshold', '0', '-g', '48', '-keyint_min', '48',
    '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
    '-hls_time', '6', '-hls_playlist_type', 'vod',
    '-hls_segment_filename', segmentPath,
    playlistPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    let durationSeconds = 0;

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      const match = text.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const [, h, m, s] = match;
        durationSeconds = Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
      }
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve({ durationSeconds: Math.round(durationSeconds) });
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}
