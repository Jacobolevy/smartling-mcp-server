import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client';

export const glossaryTools: Tool[] = [
  {
    name: 'smartling_create_glossary',
    description: 'Create a new glossary',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The account ID'
        },
        name: {
          type: 'string',
          description: 'Glossary name'
        },
        description: {
          type: 'string',
          description: 'Optional glossary description'
        },
        sourceLocaleId: {
          type: 'string',
          description: 'Source locale ID'
        },
        targetLocaleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target locale IDs'
        }
      },
      required: ['accountId', 'name', 'sourceLocaleId', 'targetLocaleIds']
    }
  },
  {
    name: 'smartling_get_glossaries',
    description: 'Get all glossaries for an account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The account ID'
        }
      },
      required: ['accountId']
    }
  },
  {
    name: 'smartling_add_glossary_term',
    description: 'Add a term to a glossary',
    inputSchema: {
      type: 'object',
      properties: {
        glossaryId: {
          type: 'string',
          description: 'The glossary ID'
        },
        sourceText: {
          type: 'string',
          description: 'Source language term'
        },
        targetText: {
          type: 'string',
          description: 'Target language term'
        },
        localeId: {
          type: 'string',
          description: 'Target locale ID'
        },
        definition: {
          type: 'string',
          description: 'Optional term definition'
        },
        partOfSpeech: {
          type: 'string',
          description: 'Part of speech (noun, verb, adjective, etc.)'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether the term is case sensitive',
          default: false
        },
        exactMatch: {
          type: 'boolean',
          description: 'Whether to match the term exactly',
          default: false
        }
      },
      required: ['glossaryId', 'sourceText', 'targetText', 'localeId']
    }
  },
  {
    name: 'smartling_get_glossary_terms',
    description: 'Get terms from a glossary',
    inputSchema: {
      type: 'object',
      properties: {
        glossaryId: {
          type: 'string',
          description: 'The glossary ID'
        },
        localeId: {
          type: 'string',
          description: 'Optional: filter by locale ID'
        }
      },
      required: ['glossaryId']
    }
  },
  {
    name: 'smartling_update_glossary_term',
    description: 'Update an existing glossary term',
    inputSchema: {
      type: 'object',
      properties: {
        glossaryId: {
          type: 'string',
          description: 'The glossary ID'
        },
        termId: {
          type: 'string',
          description: 'The term ID to update'
        },
        sourceText: {
          type: 'string',
          description: 'Updated source language term'
        },
        targetText: {
          type: 'string',
          description: 'Updated target language term'
        },
        localeId: {
          type: 'string',
          description: 'Target locale ID'
        },
        definition: {
          type: 'string',
          description: 'Updated term definition'
        },
        partOfSpeech: {
          type: 'string',
          description: 'Updated part of speech'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether the term is case sensitive'
        },
        exactMatch: {
          type: 'boolean',
          description: 'Whether to match the term exactly'
        }
      },
      required: ['glossaryId', 'termId']
    }
  },
  {
    name: 'smartling_delete_glossary_term',
    description: 'Delete a glossary term',
    inputSchema: {
      type: 'object',
      properties: {
        glossaryId: {
          type: 'string',
          description: 'The glossary ID'
        },
        termId: {
          type: 'string',
          description: 'The term ID to delete'
        }
      },
      required: ['glossaryId', 'termId']
    }
  }
];

export async function handleGlossaryTools(
  name: string,
  args: any,
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_create_glossary':
      return await client.createGlossary(args.accountId, {
        name: args.name,
        description: args.description,
        sourceLocaleId: args.sourceLocaleId,
        targetLocaleIds: args.targetLocaleIds
      });

    case 'smartling_get_glossaries':
      return await client.getGlossaries(args.accountId);

    case 'smartling_add_glossary_term':
      return await client.addGlossaryTerm(args.glossaryId, {
        sourceText: args.sourceText,
        targetText: args.targetText,
        localeId: args.localeId,
        definition: args.definition,
        partOfSpeech: args.partOfSpeech,
        caseSensitive: args.caseSensitive,
        exactMatch: args.exactMatch
      });

    case 'smartling_get_glossary_terms':
      return await client.getGlossaryTerms(args.glossaryId, args.localeId);

    case 'smartling_update_glossary_term':
      const updates: any = {};
      if (args.sourceText !== undefined) updates.sourceText = args.sourceText;
      if (args.targetText !== undefined) updates.targetText = args.targetText;
      if (args.localeId !== undefined) updates.localeId = args.localeId;
      if (args.definition !== undefined) updates.definition = args.definition;
      if (args.partOfSpeech !== undefined) updates.partOfSpeech = args.partOfSpeech;
      if (args.caseSensitive !== undefined) updates.caseSensitive = args.caseSensitive;
      if (args.exactMatch !== undefined) updates.exactMatch = args.exactMatch;

      return await client.updateGlossaryTerm(args.glossaryId, args.termId, updates);

    case 'smartling_delete_glossary_term':
      await client.deleteGlossaryTerm(args.glossaryId, args.termId);
      return { success: true, message: 'Glossary term deleted successfully' };

    default:
      throw new Error(`Unknown glossary tool: ${name}`);
  }
}
