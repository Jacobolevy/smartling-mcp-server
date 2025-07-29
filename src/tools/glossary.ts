import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addGlossaryTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_glossaries',
    'Get all glossaries for an account',
    {
      accountId: z.string().describe('The account ID'),
    },
    async ({ accountId }) => {
      try {
        const result = await client.getGlossaries(accountId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting glossaries: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_create_glossary',
    'Create a new glossary',
    {
      accountId: z.string().describe('The account ID'),
      name: z.string().describe('Name for the glossary'),
      description: z.string().optional().describe('Optional description for the glossary'),
      localeIds: z.array(z.string()).describe('Array of locale IDs for the glossary'),
    },
    async ({ accountId, name, description, localeIds }) => {
      try {
        const options: any = { name, localeIds };
        if (description !== undefined) options.description = description;
        
        const result = await client.createGlossary(accountId, options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error creating glossary: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_glossary_terms',
    'Get terms from a specific glossary',
    {
      accountId: z.string().describe('The account ID'),
      glossaryId: z.string().describe('The glossary ID'),
      localeId: z.string().optional().describe('Optional: filter by specific locale'),
      limit: z.number().optional().describe('Maximum number of results to return'),
    },
    async ({ accountId, glossaryId, localeId, limit }) => {
      try {
        const options: any = {};
        if (localeId !== undefined) options.localeId = localeId;
        if (limit !== undefined) options.limit = limit;
        
        const result = await client.getGlossaryTerms(glossaryId, localeId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting glossary terms: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_add_glossary_term',
    'Add a term to a glossary',
    {
      accountId: z.string().describe('The account ID'),
      glossaryId: z.string().describe('The glossary ID'),
      term: z.string().describe('The source term'),
      translation: z.string().describe('The translated term'),
      localeId: z.string().describe('The locale ID for the translation'),
      description: z.string().optional().describe('Optional description for the term'),
      partOfSpeech: z.string().optional().describe('Optional part of speech'),
    },
    async ({ accountId, glossaryId, term, translation, localeId, description, partOfSpeech }) => {
      try {
        const options: any = { term, translation, localeId };
        if (description !== undefined) options.description = description;
        if (partOfSpeech !== undefined) options.partOfSpeech = partOfSpeech;
        
        const result = await client.addGlossaryTerm(glossaryId, options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error adding glossary term: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );



  server.tool(
    'smartling_delete_glossary_term',
    'Delete a term from a glossary',
    {
      glossaryId: z.string().describe('The glossary ID'),
      termId: z.string().describe('The term ID to delete'),
    },
    async ({ glossaryId, termId }) => {
      try {
        await client.deleteGlossaryTerm(glossaryId, termId);
        const result = { success: true, message: 'Glossary term deleted successfully' };
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting glossary term: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
