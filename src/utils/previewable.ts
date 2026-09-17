export type PreviewKind = 'image' | 'pdf' | 'text' | 'video' | 'audio';

interface PreviewInfo {
  kind: PreviewKind;
  contentType: string;
}

const PREVIEWABLE_EXTENSIONS: Record<string, PreviewInfo> = {
  jpg: { kind: 'image', contentType: 'image/jpeg' },
  jpeg: { kind: 'image', contentType: 'image/jpeg' },
  png: { kind: 'image', contentType: 'image/png' },
  gif: { kind: 'image', contentType: 'image/gif' },
  webp: { kind: 'image', contentType: 'image/webp' },
  svg: { kind: 'image', contentType: 'image/svg+xml' },
  pdf: { kind: 'pdf', contentType: 'application/pdf' },
  txt: { kind: 'text', contentType: 'text/plain' },
  csv: { kind: 'text', contentType: 'text/plain' },
  log: { kind: 'text', contentType: 'text/plain' },
  json: { kind: 'text', contentType: 'text/plain' },
  mp4: { kind: 'video', contentType: 'video/mp4' },
  webm: { kind: 'video', contentType: 'video/webm' },
  mov: { kind: 'video', contentType: 'video/quicktime' },
  mp3: { kind: 'audio', contentType: 'audio/mpeg' },
  wav: { kind: 'audio', contentType: 'audio/wav' },
  ogg: { kind: 'audio', contentType: 'audio/ogg' },
};

export function getPreviewInfo(key: string): PreviewInfo | null {
  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  return PREVIEWABLE_EXTENSIONS[extension] ?? null;
}

export function kindFromContentType(contentType: string): PreviewKind | null {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType.startsWith('text/')) return 'text';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return null;
}
