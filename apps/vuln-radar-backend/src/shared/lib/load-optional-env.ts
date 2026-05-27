import { loadEnvFile } from 'node:process';

export function loadOptionalEnvFile(path = '.env') {
  try {
    loadEnvFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}
