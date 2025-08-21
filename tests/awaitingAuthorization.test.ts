import { describe, it, expect, vi } from 'vitest';
import { computeAwaitingAuthorization } from '../src/services/awaitingAuthorization.ts';

describe('computeAwaitingAuthorization', () => {
  it('computes awaiting authorization counts with mocked client', async () => {
    const mockClient: any = {
      getProjectFiles: vi.fn().mockResolvedValue({ items: [
        { fileUri: 'a/file1_en.properties' },
        { fileUri: 'b/file2_en.properties' }
      ]}),
      getProjects: vi.fn().mockResolvedValue([{ projectId: 'p1', targetLocales: [{ localeId: 'es-ES' }, { localeId: 'fr-FR' }] }]),
      getFileSourceStrings: vi.fn()
        .mockResolvedValueOnce({ items: [{ hashcode: 'h1' }, { hashcode: 'h2' }] })
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ items: [{ hashcode: 'h3' }] })
        .mockResolvedValueOnce({ items: [] }),
      getStringTranslationsBatch: vi.fn().mockImplementation(async (_projectId: string, hashcodes: string[]) => {
        const out: Record<string, any> = {};
        for (const h of hashcodes) {
          out[h] = {}; // no translations -> awaiting
        }
        return out;
      })
    };

    const res = await computeAwaitingAuthorization(mockClient, 'p1');
    expect(res.totalAwaiting).toBeGreaterThan(0);
    expect(Object.keys(res.breakdown).length).toBe(2);
    expect(res.meta.projectId).toBe('p1');
    expect(res.meta.targetLocales.length).toBe(2);
  });

  it('excludes EXCLUDED hashcodes via advanced search', async () => {
    const mockClient: any = {
      getProjectFiles: vi.fn().mockResolvedValue({ items: [
        { fileUri: 'a/file1.properties' }
      ]}),
      getProjects: vi.fn().mockResolvedValue([{ projectId: 'p1', targetLocales: [{ localeId: 'es-ES' }] }]),
      getFileSourceStrings: vi.fn()
        .mockResolvedValueOnce({ items: [{ hashcode: 'h1' }, { hashcode: 'h2' }, { hashcode: 'h3' }] })
        .mockResolvedValueOnce({ items: [] }),
      searchStringsAdvanced: vi.fn().mockResolvedValue({ items: [{ hashcode: 'h2' }] }),
      getStringTranslationsBatch: vi.fn().mockImplementation(async (_projectId: string, hashcodes: string[]) => {
        const out: Record<string, any> = {};
        for (const h of hashcodes) {
          out[h] = {}; // no translations
        }
        return out;
      })
    };

    const res = await computeAwaitingAuthorization(mockClient, 'p1');
    expect(res.breakdown['a/file1.properties']).toBe(2); // h2 excluded, h1,h3 awaiting
  });
});


