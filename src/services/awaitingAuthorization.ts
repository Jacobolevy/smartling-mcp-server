import { SmartlingClient } from '../smartling-client.js';

type AwaitingAuthResult = {
  totalAwaiting: number;
  breakdown: Record<string, number>;
  meta: { projectId: string; filesCount: number; targetLocales: string[] };
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const encodeFileUri = (raw: string): string => raw.split('/').map(encodeURIComponent).join('/');

export async function getAllSourceHashcodes(
  client: SmartlingClient,
  projectId: string,
  fileUri: string
): Promise<string[]> {
  const safeUri = encodeFileUri(fileUri);
  const limitPrimary = 500;
  let offset = 0;
  const out: string[] = [];
  while (true) {
    try {
      const res = await client.getFileSourceStrings(projectId, safeUri, { limit: limitPrimary, offset, includeInactive: true });
      const items = res?.items || [];
      if (items.length === 0) break;
      out.push(...items.map((i: any) => i.hashcode));
      offset += items.length;
      if (items.length < limitPrimary) break;
    } catch (e: any) {
      // fallback to smaller limit
      const retryLimit = 250;
      const res2 = await client.getFileSourceStrings(projectId, safeUri, { limit: retryLimit, offset, includeInactive: true });
      const items2 = res2?.items || [];
      if (items2.length === 0) break;
      out.push(...items2.map((i: any) => i.hashcode));
      offset += items2.length;
      if (items2.length < retryLimit) break;
    }
  }
  return out;
}

export async function getExcludedHashcodes(
  client: SmartlingClient,
  projectId: string,
  fileUri: string
): Promise<Set<string>> {
  const limit = 500;
  let offset = 0;
  const excluded = new Set<string>();
  while (true) {
    try {
      const res = await client.searchStringsAdvanced(projectId, {
        fileUri,
        translationStatus: 'EXCLUDED',
        searchText: '*',
        limit,
        offset,
      });
      const items = res?.items || [];
      for (const it of items) {
        if (it.hashcode) excluded.add(it.hashcode);
      }
      if (items.length < limit) break;
      offset += items.length;
    } catch {
      break;
    }
    await sleep(10);
  }
  return excluded;
}

export async function computeAwaitingAuthorization(
  client: SmartlingClient,
  projectId: string,
  targetLocales?: string[],
  fileUris?: string[]
): Promise<AwaitingAuthResult> {
  const filesResp = await client.getProjectFiles(projectId);
  const allFiles: string[] = Array.isArray(filesResp.items) ? filesResp.items.map((f: any) => f.fileUri) : [];
  const files = fileUris && fileUris.length > 0 ? allFiles.filter(f => fileUris.includes(f)) : allFiles;

  // If no locales provided, use project target locales
  let locales = targetLocales && targetLocales.length > 0 ? targetLocales : [];
  if (locales.length === 0) {
    const projects = await client.getProjects();
    const project = Array.isArray(projects) ? projects.find((p: any) => p.projectId === projectId) : undefined;
    locales = (project?.targetLocales || []).map((l: any) => l.localeId);
  }

  let total = 0;
  const breakdown: Record<string, number> = {};

  const concurrency = Math.max(1, parseInt(process.env.SMARTLING_CONCURRENCY || '5'));
  let active = 0;
  const queue: Array<() => Promise<void>> = [];
  const run = async (fn: () => Promise<void>) => {
    if (active >= concurrency) {
      await new Promise<void>(resolve => queue.push(async () => { await fn(); resolve(); }));
      return;
    }
    active++;
    try {
      await fn();
    } finally {
      active--;
      const next = queue.shift();
      if (next) await run(next);
    }
  };

  const tasks: Promise<void>[] = [];
  for (const fileUri of files) {
    tasks.push(run(async () => {
      const [hashes, excluded] = await Promise.all([
        getAllSourceHashcodes(client, projectId, fileUri),
        getExcludedHashcodes(client, projectId, fileUri),
      ]);
      const candidates = hashes.filter(h => !excluded.has(h));
      let awaitingInFile = 0;
      const batchSize = Math.max(50, parseInt(process.env.SMARTLING_BATCH_SIZE || '300'));
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const trMap = await client.getStringTranslationsBatch(projectId, batch, locales, batchSize);
        for (const h of batch) {
          const localesMap = trMap[h] || {};
          const statuses = Object.values(localesMap).map((s: any) => s?.status || s);
          const authorized = statuses.some((s: any) => ['IN_PROGRESS', 'COMPLETED', 'PUBLISHED'].includes(String(s)));
          if (!authorized) awaitingInFile++;
        }
      }
      breakdown[fileUri] = awaitingInFile;
      total += awaitingInFile;
    }));
  }

  await Promise.all(tasks);

  return {
    totalAwaiting: total,
    breakdown,
    meta: { projectId, filesCount: files.length, targetLocales: locales }
  };
}


