import type { FileMap } from '@/artifacts/bolt/lib/stores/files';

export interface Snapshot {
  chatIndex: string;
  files: FileMap;
  summary?: string;
}
