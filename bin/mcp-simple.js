
#!/usr/bin/env node

/**
 * 🌟 Smartling MCP Server - Simplified & Compatible
 * Minimal MCP server for Claude Desktop & Cursor
 */

const readline = require('readline');
const https = require('https');
const { URL } = require('url');

// === SMARTLING CLIENT ===
class SmartlingClient {
  constructor({ userIdentifier, userSecret, baseUrl = 'https://api.smartling.com' }) {
    this.userIdentifier = userIdentifier;
    this.userSecret = userSecret;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = `${this.baseUrl}/auth-api/v2/authenticate`;
    const authData = {
      userIdentifier: this.userIdentifier,
      userSecret: this.userSecret
    };

    try {
      const response = await this.makeHttpRequest(authUrl, 'POST', authData);
      this.accessToken = response.response.data.accessToken;
      this.tokenExpiry = new Date(Date.now() + response.response.data.expiresIn * 1000);
      return this.accessToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async makeHttpRequest(url, method = 'GET', data = null) {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Smartling-MCP-Server/3.0.0'
      }
    };

    if (this.accessToken) {
      options.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const postData = data ? JSON.stringify(data) : null;
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.authenticate();
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.makeHttpRequest(url, method, data);
    return response;
  }

  // === API METHODS ===
  async getAccountInfo() {
    const response = await this.makeRequest('/accounts-api/v2/accounts');
    return response.response.data;
  }

  async listProjects() {
    const response = await this.makeRequest('/projects-api/v2/projects');
    return response.response.data;
  }

  async getProjectDetails(projectId) {
    const response = await this.makeRequest(`/projects-api/v2/projects/${projectId}`);
    return response.response.data;
  }

  async listFiles(projectId) {
    const response = await this.makeRequest(`/files-api/v2/projects/${projectId}/files/list`);
    return response.response.data;
  }

  async searchStrings(projectId, searchText, localeId = null, limit = 50) {
    process.stderr.write(`DEBUG: Searching strings with new approach for: ${searchText}\n`);
    
    // Get all project files
    const files = await this.listFiles(projectId);
    const foundStrings = [];
    let processedCount = 0;
    
    for (const file of files.items) {
      if (processedCount >= limit) break;
      
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        
        // Search for strings containing the search text
        const matchingStrings = sourceStrings.filter(str => 
          str.stringVariant && str.stringVariant.toLowerCase().includes(searchText.toLowerCase())
        );
        
        for (const match of matchingStrings) {
          if (processedCount >= limit) break;
          
          foundStrings.push({
            stringVariant: match.stringVariant,
            hashcode: match.hashcode,
            fileUri: file.fileUri,
            lastModified: file.lastUploaded,
            created: file.created
          });
          processedCount++;
        }
      } catch (error) {
        process.stderr.write(`DEBUG: Error searching file ${file.fileUri}: ${error.message}\n`);
        continue;
      }
    }
    
    process.stderr.write(`DEBUG: Found ${foundStrings.length} matching strings\n`);
    return { items: foundStrings, totalCount: foundStrings.length };
  }

  async addTagToString(projectId, hashcode, localeId, tag) {
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`,
      'POST',
      { tags: [tag] }
    );
    return response.response.data;
  }

  async getStringTags(projectId, hashcode, localeId) {
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`
    );
    return response.response.data;
  }

  async getSourceStringsForFile(projectId, fileUri) {
    let allStrings = [];
    let offset = 0;
    const pageSize = 500;
    
    while (true) {
      const url = `/strings-api/v2/projects/${projectId}/source-strings?fileUri=${encodeURIComponent(fileUri)}&offset=${offset}&limit=${pageSize}`;
      
      try {
        const response = await this.makeRequest(url);
        const items = response.response.data.items || [];
        allStrings = allStrings.concat(items);
        
        if (items.length < pageSize) {
          break;
        }
        
        offset += pageSize;
      } catch (error) {
        process.stderr.write(`DEBUG: Error getting strings for file ${fileUri}: ${error.message}\n`);
        break;
      }
    }
    
    return allStrings;
  }

  async findHashcodeForKey(projectId, keyName) {
    process.stderr.write(`DEBUG: Looking for key: ${keyName}\n`);
    
    // Get all project files
    const files = await this.listFiles(projectId);
    process.stderr.write(`DEBUG: Found ${files.items.length} files to search\n`);
    
    // Search through files for the key
    for (const file of files.items) {
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        process.stderr.write(`DEBUG: Searching in file ${file.fileUri} (${sourceStrings.length} strings)\n`);
        
        const foundString = sourceStrings.find(str => str.stringVariant === keyName);
        if (foundString) {
          process.stderr.write(`DEBUG: Found key ${keyName} with hashcode ${foundString.hashcode}\n`);
          return {
            hashcode: foundString.hashcode,
            fileUri: file.fileUri,
            keyName: keyName
          };
        }
      } catch (error) {
        process.stderr.write(`DEBUG: Error searching file ${file.fileUri}: ${error.message}\n`);
        continue;
      }
    }
    
    throw new Error(`Key "${keyName}" not found in any project files`);
  }

  async addTagsToStrings(projectId, hashcodes, tags) {
    const response = await this.makeRequest(
      `/tags-api/v2/projects/${projectId}/strings/tags/add`,
      'POST',
      {
        stringHashcodes: hashcodes,
        tags: tags
      }
    );
    return response.response.data;
  }

  async searchAndTag(projectId, searchText, tags, limit = 20) {
    process.stderr.write(`DEBUG: Searching and tagging strings containing: ${searchText}\n`);
    
    // Search for strings
    const searchResults = await this.searchStrings(projectId, searchText, null, limit);
    
    if (!searchResults.items || searchResults.items.length === 0) {
      return {
        message: `No strings found containing "${searchText}"`,
        processed: 0,
        foundStrings: []
      };
    }
    
    // Extract hashcodes
    const hashcodes = searchResults.items.map(item => item.hashcode);
    
    // Add tags to found strings
    await this.addTagsToStrings(projectId, hashcodes, tags);
    
    process.stderr.write(`DEBUG: Tagged ${hashcodes.length} strings with tags: ${tags.join(', ')}\n`);
    
    return {
      message: `Successfully tagged ${hashcodes.length} strings with tags: ${tags.join(', ')}`,
      processed: hashcodes.length,
      foundStrings: searchResults.items.map(item => ({
        key: item.stringVariant,
        hashcode: item.hashcode,
        file: item.fileUri
      })),
      tags: tags
    };
  }

  async findLatestTranslations(projectId, searchText, limit = 10) {
    process.stderr.write(`DEBUG: Finding latest translations for: ${searchText}\n`);
    
    // Search for strings
    const searchResults = await this.searchStrings(projectId, searchText, null, limit);
    
    if (!searchResults.items || searchResults.items.length === 0) {
      return {
        message: `No strings found containing "${searchText}"`,
        items: []
      };
    }
    
    // Sort by last modified date (most recent first)
    const sortedResults = searchResults.items.sort((a, b) => 
      new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
    );
    
    return {
      message: `Found ${sortedResults.length} strings, sorted by latest modifications`,
      items: sortedResults.map(item => ({
        key: item.stringVariant,
        hashcode: item.hashcode,
        file: item.fileUri,
        lastModified: item.lastModified,
        created: item.created
      }))
    };
  }

  async getTranslationStats(projectId, localeId = null) {
    process.stderr.write(`DEBUG: Getting translation statistics for project ${projectId}\n`);
    
    const files = await this.listFiles(projectId);
    let totalStrings = 0;
    let totalFiles = files.items.length;
    const fileStats = [];
    
    for (const file of files.items) {
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        totalStrings += sourceStrings.length;
        
        fileStats.push({
          fileName: file.fileUri.split('/').pop() || file.fileUri,
          fullPath: file.fileUri,
          stringCount: sourceStrings.length,
          lastModified: file.lastUploaded,
          created: file.created
        });
      } catch (error) {
        process.stderr.write(`DEBUG: Error getting stats for ${file.fileUri}: ${error.message}\n`);
      }
    }
    
    // Sort files by string count (descending)
    fileStats.sort((a, b) => b.stringCount - a.stringCount);
    
    return {
      project: {
        projectId,
        totalFiles,
        totalStrings,
        averageStringsPerFile: Math.round(totalStrings / totalFiles)
      },
      topFiles: fileStats.slice(0, 10),
      allFiles: fileStats
    };
  }

  async getAllProjectTags(projectId) {
    process.stderr.write(`DEBUG: Getting all tags for project ${projectId}\n`);
    
    const response = await this.makeRequest(`/tags-api/v2/projects/${projectId}/tags`);
    return response.response.data.items.map(item => item.tag);
  }

  async getStringTags(projectId, hashcodes) {
    process.stderr.write(`DEBUG: Getting tags for ${hashcodes.length} strings\n`);
    
    const response = await this.makeRequest(
      `/tags-api/v2/projects/${projectId}/strings/tags/search`,
      'POST',
      { stringHashcodes: hashcodes }
    );
    
    return response.response.data.items.map(item => ({
      hashcode: item.stringHashcode,
      tags: item.tags.map(tag => tag.tag)
    }));
  }

  async findDuplicateStrings(projectId, limit = 50) {
    process.stderr.write(`DEBUG: Finding duplicate strings in project ${projectId}\n`);
    
    const files = await this.listFiles(projectId);
    const allStrings = [];
    
    for (const file of files.items) {
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        for (const str of sourceStrings) {
          allStrings.push({
            ...str,
            fileUri: file.fileUri
          });
        }
      } catch (error) {
        process.stderr.write(`DEBUG: Error processing ${file.fileUri}: ${error.message}\n`);
      }
    }
    
    // Group by parsed text to find duplicates
    const stringGroups = {};
    allStrings.forEach(str => {
      const text = str.parsedStringText || str.stringVariant;
      if (!stringGroups[text]) {
        stringGroups[text] = [];
      }
      stringGroups[text].push(str);
    });
    
    // Find duplicates
    const duplicates = Object.entries(stringGroups)
      .filter(([text, strings]) => strings.length > 1)
      .map(([text, strings]) => ({
        text,
        count: strings.length,
        strings: strings.map(str => ({
          key: str.stringVariant,
          hashcode: str.hashcode,
          file: str.fileUri
        }))
      }))
      .slice(0, limit);
    
    return {
      totalDuplicateGroups: duplicates.length,
      duplicates
    };
  }

  async findUntranslatedStrings(projectId, localeId, limit = 50) {
    process.stderr.write(`DEBUG: Finding untranslated strings for locale ${localeId}\n`);
    
    const files = await this.listFiles(projectId);
    const untranslatedStrings = [];
    
    for (const file of files.items.slice(0, 10)) { // Limit files for performance
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        
        for (const str of sourceStrings.slice(0, 20)) { // Limit strings per file
          try {
            // Try to get translations for this string
            const response = await this.makeRequest(
              `/strings-api/v2/projects/${projectId}/translations?hashcodes=${str.hashcode}&targetLocaleId=${localeId}`
            );
            
            const translations = response.response.data.items;
            const hasTranslation = translations.length > 0 && 
                                 translations[0].translations && 
                                 translations[0].translations.length > 0;
            
            if (!hasTranslation) {
              untranslatedStrings.push({
                key: str.stringVariant,
                hashcode: str.hashcode,
                file: file.fileUri,
                text: str.parsedStringText
              });
              
              if (untranslatedStrings.length >= limit) break;
            }
          } catch (error) {
            // Skip translation check errors
          }
        }
        
        if (untranslatedStrings.length >= limit) break;
      } catch (error) {
        process.stderr.write(`DEBUG: Error processing ${file.fileUri}: ${error.message}\n`);
      }
    }
    
    return {
      localeId,
      untranslatedCount: untranslatedStrings.length,
      strings: untranslatedStrings
    };
  }

  async findKeysWithInvalidHashcode(projectId, keysToCheck) {
    process.stderr.write(`DEBUG: Checking ${keysToCheck.length} keys for invalid hashcodes\n`);
    
    const hashcodesInfo = [];
    for (const key of keysToCheck) {
      try {
        const result = await this.findHashcodeForKey(projectId, key);
        hashcodesInfo.push({
          localeKey: key,
          hashcode: result.hashcode
        });
      } catch (error) {
        hashcodesInfo.push({
          localeKey: key,
          hashcode: null,
          error: error.message
        });
      }
    }
    
    const validHashcodes = hashcodesInfo.filter(info => info.hashcode).map(info => info.hashcode);
    
    if (validHashcodes.length === 0) {
      return {
        invalidKeys: keysToCheck,
        validKeys: [],
        message: 'All provided keys are invalid'
      };
    }
    
    // Check which hashcodes actually exist in Smartling
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/source-strings?hashcodes=${validHashcodes.join(',')}&limit=500`
    );
    
    const foundHashcodes = new Set(response.response.data.items.map(item => item.hashcode));
    
    const invalidKeys = hashcodesInfo
      .filter(info => !info.hashcode || !foundHashcodes.has(info.hashcode))
      .map(info => info.localeKey);
    
    const validKeys = hashcodesInfo
      .filter(info => info.hashcode && foundHashcodes.has(info.hashcode))
      .map(info => info.localeKey);
    
    return {
      invalidKeys,
      validKeys,
      message: `Found ${invalidKeys.length} invalid and ${validKeys.length} valid keys`
    };
  }

  async getStringFileContent(projectId, fileUri) {
    process.stderr.write(`DEBUG: Getting content for file ${fileUri}\n`);
    
    const response = await this.makeRequest(
      `/files-api/v2/projects/${projectId}/file?fileUri=${encodeURIComponent(fileUri)}`
    );
    
    return response;
  }

  async searchWithRegex(projectId, regexPattern, limit = 50) {
    process.stderr.write(`DEBUG: Searching with regex pattern: ${regexPattern}\n`);
    
    const files = await this.listFiles(projectId);
    const matchingStrings = [];
    const regex = new RegExp(regexPattern, 'i');
    
    for (const file of files.items) {
      if (matchingStrings.length >= limit) break;
      
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, file.fileUri);
        
        for (const str of sourceStrings) {
          if (matchingStrings.length >= limit) break;
          
          if (regex.test(str.stringVariant) || regex.test(str.parsedStringText || '')) {
            matchingStrings.push({
              key: str.stringVariant,
              hashcode: str.hashcode,
              file: file.fileUri,
              text: str.parsedStringText,
              matchType: regex.test(str.stringVariant) ? 'key' : 'text'
            });
          }
        }
      } catch (error) {
        process.stderr.write(`DEBUG: Error processing ${file.fileUri}: ${error.message}\n`);
      }
    }
    
    return {
      pattern: regexPattern,
      matchCount: matchingStrings.length,
      matches: matchingStrings
    };
  }

  async getContextBindings(projectId, hashcodes) {
    process.stderr.write(`DEBUG: Getting context bindings for ${hashcodes.length} strings\n`);
    
    const response = await this.makeRequest(
      `/context-api/v2/projects/${projectId}/bindings/list`,
      'POST',
      { stringHashcodes: hashcodes }
    );
    
    return response.response.data.items.map(binding => ({
      hashcode: binding.stringHashcode,
      contextUid: binding.contextUid,
      bindingUid: binding.bindingUid,
      coordinates: binding.coordinates,
      contextPosition: binding.contextPosition
    }));
  }

  async batchOperations(projectId, operations) {
    process.stderr.write(`DEBUG: Executing ${operations.length} batch operations\n`);
    
    const results = [];
    
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'search':
            result = await this.searchStrings(projectId, operation.searchText, null, operation.limit || 10);
            break;
            
          case 'tag':
            if (operation.hashcodes && operation.tags) {
              result = await this.addTagsToStrings(projectId, operation.hashcodes, operation.tags);
            }
            break;
            
          case 'findHashcode':
            if (operation.keyName) {
              result = await this.findHashcodeForKey(projectId, operation.keyName);
            }
            break;
            
          default:
            result = { error: `Unknown operation type: ${operation.type}` };
        }
        
        results.push({
          operation: operation.type,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          operation: operation.type,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalOperations: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async getAllSourceStringsHashcodes(projectId, fileUris) {
    process.stderr.write(`DEBUG: Getting all source strings hashcodes for ${fileUris.length} files\n`);
    
    const allSourceStrings = await this.getAllSourceStrings(projectId, fileUris);
    
    return allSourceStrings.map(sourceStringInfo => ({
      localeKey: sourceStringInfo.stringVariant,
      hashcode: sourceStringInfo.hashcode
    }));
  }

  async getAllSourceStrings(projectId, fileUris) {
    process.stderr.write(`DEBUG: Getting all source strings for ${fileUris.length} files\n`);
    
    const allSourceStrings = [];
    
    for (const fileUri of fileUris) {
      try {
        const sourceStrings = await this.getSourceStringsForFile(projectId, fileUri);
        allSourceStrings.push(...sourceStrings);
      } catch (error) {
        process.stderr.write(`DEBUG: Error getting strings from ${fileUri}: ${error.message}\n`);
      }
    }
    
    return allSourceStrings;
  }

  async getAccessToken() {
    process.stderr.write(`DEBUG: Getting current access token\n`);
    await this.authenticate();
    return {
      accessToken: this.accessToken,
      expiresAt: this.tokenExpiry
    };
  }

  async listAllTranslations(projectId, hashcodes, localeId) {
    process.stderr.write(`DEBUG: Listing all translations for ${hashcodes.length} strings in locale ${localeId}\n`);
    
    const chunks = [];
    const chunkSize = 400; // Split into chunks for API limits
    
    for (let i = 0; i < hashcodes.length; i += chunkSize) {
      chunks.push(hashcodes.slice(i, i + chunkSize));
    }
    
    const allTranslations = [];
    
    for (const chunk of chunks) {
      try {
        const response = await this.makeRequest(
          `/strings-api/v2/projects/${projectId}/translations?hashcodes=${chunk.join(',')}&targetLocaleId=${localeId}`
        );
        
        allTranslations.push(...response.response.data.items.map(item => ({
          hashcode: item.hashcode,
          translations: item.translations || []
        })));
      } catch (error) {
        process.stderr.write(`DEBUG: Error getting translations for chunk: ${error.message}\n`);
      }
    }
    
    return allTranslations;
  }

  async resolveStringsTags(projectId, hashcodeInfos) {
    process.stderr.write(`DEBUG: Resolving tags for ${hashcodeInfos.length} strings\n`);
    
    const chunks = [];
    const chunkSize = 1000;
    
    for (let i = 0; i < hashcodeInfos.length; i += chunkSize) {
      chunks.push(hashcodeInfos.slice(i, i + chunkSize));
    }
    
    const allResults = [];
    
    for (const chunk of chunks) {
      try {
        const response = await this.makeRequest(
          `/tags-api/v2/projects/${projectId}/strings/tags/search`,
          'POST',
          { stringHashcodes: chunk.map(info => info.hashcode) }
        );
        
        const tagsData = response.response.data.items;
        
        // Map back to original hashcode info
        for (const info of chunk) {
          const tagInfo = tagsData.find(t => t.stringHashcode === info.hashcode);
          allResults.push({
            ...info,
            tags: tagInfo ? tagInfo.tags.map(tag => tag.tag) : []
          });
        }
      } catch (error) {
        process.stderr.write(`DEBUG: Error resolving tags for chunk: ${error.message}\n`);
        // Add empty results for failed chunk
        for (const info of chunk) {
          allResults.push({
            ...info,
            tags: []
          });
        }
      }
    }
    
    return allResults;
  }

  async getSourceStringsHashes(projectId, localeKeys, fileUris) {
    process.stderr.write(`DEBUG: Getting source strings hashes for ${localeKeys.length} keys\n`);
    
    const allSourceStrings = await this.getAllSourceStrings(projectId, fileUris);
    const results = [];
    
    for (const key of localeKeys) {
      const found = allSourceStrings.find(str => str.stringVariant === key);
      if (found) {
        results.push({
          localeKey: key,
          hashcode: found.hashcode
        });
      }
    }
    
    return results;
  }

  async associateStringsWithContext(projectId, hashcodes, contextUid) {
    process.stderr.write(`DEBUG: Associating ${hashcodes.length} strings with context ${contextUid}\n`);
    
    const response = await this.makeRequest(
      `/context-api/v2/projects/${projectId}/bindings`,
      'POST',
      {
        bindings: hashcodes.map(hashcode => ({
          contextUid: contextUid,
          stringHashcode: hashcode
        }))
      }
    );
    
    return response.response.data;
  }

  async createImageContext(projectId, imageContent, fileName) {
    process.stderr.write(`DEBUG: Creating image context for file ${fileName}\n`);
    
    // For now, we'll create a placeholder implementation
    // In a full implementation, you'd need to handle file uploads properly
    const contextName = fileName || `context-${Date.now()}.png`;
    
    // This would need proper form-data handling for file uploads
    return {
      error: 'Image context creation requires file upload support - not implemented in simplified version',
      contextName: contextName,
      note: 'Use Smartling dashboard for image context creation'
    };
  }

  async resolveSourceStringsContextBindings(projectId, hashcodes) {
    process.stderr.write(`DEBUG: Resolving context bindings for ${hashcodes.length} strings\n`);
    
    const response = await this.makeRequest(
      `/context-api/v2/projects/${projectId}/bindings/list`,
      'POST',
      { stringHashcodes: hashcodes }
    );
    
    return response.response.data.items.map(binding => ({
      hashcode: binding.stringHashcode,
      contextUid: binding.contextUid,
      bindingUid: binding.bindingUid,
      coordinates: binding.coordinates,
      contextPosition: binding.contextPosition
    }));
  }

  // === JOBS/WORKFLOWS METHODS ===
  async createJob(projectId, jobData) {
    process.stderr.write(`DEBUG: Creating job "${jobData.jobName}" for project ${projectId}\n`);
    
    const response = await this.makeRequest(
      `/jobs-api/v3/projects/${projectId}/jobs`,
      'POST',
      jobData
    );
    return response.response.data;
  }

  async listJobs(projectId, status = null) {
    let endpoint = `/jobs-api/v3/projects/${projectId}/jobs`;
    if (status) {
      endpoint += `?status=${status}`;
    }
    
    const response = await this.makeRequest(endpoint);
    return response.response.data;
  }

  async getJobDetails(projectId, jobId) {
    const response = await this.makeRequest(
      `/jobs-api/v3/projects/${projectId}/jobs/${jobId}`
    );
    return response.response.data;
  }

  async authorizeJob(projectId, jobId) {
    const response = await this.makeRequest(
      `/jobs-api/v3/projects/${projectId}/jobs/${jobId}/authorize`,
      'POST'
    );
    return response.response.data;
  }

  async closeJob(projectId, jobId) {
    const response = await this.makeRequest(
      `/jobs-api/v3/projects/${projectId}/jobs/${jobId}/close`,
      'POST'
    );
    return response.response.data;
  }

  // === FILE OPERATIONS METHODS ===
  async uploadFile(projectId, fileData) {
    process.stderr.write(`DEBUG: Uploading file ${fileData.fileUri} to project ${projectId}\n`);
    
    // For simplicity, using JSON API instead of FormData
    const response = await this.makeRequest(
      `/files-api/v2/projects/${projectId}/file`,
      'POST',
      fileData
    );
    return response.response.data;
  }

  async downloadFile(projectId, fileUri, localeId, options = {}) {
    let endpoint = `/files-api/v2/projects/${projectId}/locales/${localeId}/file`;
    const params = new URLSearchParams({
      fileUri: fileUri,
      ...options
    });
    endpoint += `?${params.toString()}`;

    const response = await this.makeRequest(endpoint);
    return response.response.data;
  }

  async getFileStatus(projectId, fileUri) {
    const params = new URLSearchParams({ fileUri });
    const response = await this.makeRequest(
      `/files-api/v2/projects/${projectId}/file/status?${params.toString()}`
    );
    return response.response.data;
  }

  async deleteFile(projectId, fileUri) {
    const params = new URLSearchParams({ fileUri });
    const response = await this.makeRequest(
      `/files-api/v2/projects/${projectId}/file?${params.toString()}`,
      'DELETE'
    );
    return response.response.data;
  }

  // === QUALITY ASSURANCE METHODS ===
  async runQualityCheck(projectId, fileUris, localeIds, checkTypes) {
    const response = await this.makeRequest(
      `/quality-checks-api/v3/projects/${projectId}/checks`,
      'POST',
      {
        fileUris,
        localeIds,
        checkTypes
      }
    );
    return response.response.data;
  }

  async getQualityCheckReport(projectId, checkId) {
    const response = await this.makeRequest(
      `/quality-checks-api/v3/projects/${projectId}/checks/${checkId}`
    );
    return response.response.data;
  }

  async listQualityChecks(projectId) {
    const response = await this.makeRequest(
      `/quality-checks-api/v3/projects/${projectId}/checks`
    );
    return response.response.data;
  }

  // === GLOSSARY METHODS ===
  async getGlossaries() {
    const response = await this.makeRequest('/glossary-api/v3/accounts/{accountUid}/glossaries');
    return response.response.data;
  }

  async createGlossary(glossaryData) {
    const response = await this.makeRequest(
      '/glossary-api/v3/accounts/{accountUid}/glossaries',
      'POST',
      glossaryData
    );
    return response.response.data;
  }

  async createGlossaryTerm(glossaryId, termData) {
    const response = await this.makeRequest(
      `/glossary-api/v3/accounts/{accountUid}/glossaries/${glossaryId}/entries`,
      'POST',
      termData
    );
    return response.response.data;
  }

  // === WEBHOOK METHODS ===
  async createWebhook(projectId, webhookData) {
    const response = await this.makeRequest(
      `/webhooks-api/v2/projects/${projectId}/webhooks`,
      'POST',
      webhookData
    );
    return response.response.data;
  }

  async listWebhooks(projectId) {
    const response = await this.makeRequest(
      `/webhooks-api/v2/projects/${projectId}/webhooks`
    );
    return response.response.data;
  }

  async deleteWebhook(projectId, webhookUid) {
    const response = await this.makeRequest(
      `/webhooks-api/v2/projects/${projectId}/webhooks/${webhookUid}`,
      'DELETE'
    );
    return response.response.data;
  }

  // === UTILITY METHODS ===
  async diagnostic() {
    try {
      // Test basic authentication and account access
      const accountInfo = await this.getAccountInfo();
      
      return {
        status: 'healthy',
        authenticated: true,
        accountInfo: accountInfo,
        baseUrl: this.baseUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        authenticated: false,
        error: error.message,
        baseUrl: this.baseUrl,
        timestamp: new Date().toISOString()
      };
    }
  }

  async createProject(projectData) {
    const response = await this.makeRequest(
      '/projects-api/v2/projects',
      'POST',
      projectData
    );
    return response.response.data;
  }

  async removeTagFromString(projectId, hashcode, localeId, tag) {
    const response = await this.makeRequest(
      `/tags-api/v2/projects/${projectId}/strings/tags/remove`,
      'POST',
      {
        stringHashcodes: [hashcode],
        tags: [tag]
      }
    );
    return response.response.data;
  }

  async getWorkflowSteps(projectId) {
    const response = await this.makeRequest(
      `/workflows-api/v2/projects/${projectId}/workflows`
    );
    return response.response.data;
  }

  async resolveLocalesLastModified(projectId, fileUri) {
    const params = new URLSearchParams({ fileUri });
    const response = await this.makeRequest(
      `/files-api/v2/projects/${projectId}/file/last-modified?${params.toString()}`
    );
    
    // Convert to object format like devzai
    const result = {};
    response.response.data.items.forEach(item => {
      result[item.localeId] = item.lastModified;
    });
    
    return result;
  }

  // === ESTIMATES METHODS ===
  async createEstimate(projectId, estimateData) {
    process.stderr.write(`DEBUG: Creating estimate for project ${projectId}\n`);
    
    const response = await this.makeRequest(
      `/estimates-api/v2/projects/${projectId}/estimates`,
      'POST',
      estimateData
    );
    return response.response.data;
  }

  async getEstimateDetails(projectId, estimateId) {
    const response = await this.makeRequest(
      `/estimates-api/v2/projects/${projectId}/estimates/${estimateId}`
    );
    return response.response.data;
  }

  async listEstimates(projectId, status = null) {
    let endpoint = `/estimates-api/v2/projects/${projectId}/estimates`;
    if (status) {
      endpoint += `?status=${status}`;
    }
    
    const response = await this.makeRequest(endpoint);
    return response.response.data;
  }

  // === ISSUES METHODS ===
  async createIssue(projectId, issueData) {
    process.stderr.write(`DEBUG: Creating issue for project ${projectId}\n`);
    
    const response = await this.makeRequest(
      `/issues-api/v2/projects/${projectId}/issues`,
      'POST',
      issueData
    );
    return response.response.data;
  }

  async listIssues(projectId, status = null) {
    let endpoint = `/issues-api/v2/projects/${projectId}/issues`;
    if (status) {
      endpoint += `?status=${status}`;
    }
    
    const response = await this.makeRequest(endpoint);
    return response.response.data;
  }

  async getIssueDetails(projectId, issueId) {
    const response = await this.makeRequest(
      `/issues-api/v2/projects/${projectId}/issues/${issueId}`
    );
    return response.response.data;
  }

  async resolveIssue(projectId, issueId, resolution) {
    const response = await this.makeRequest(
      `/issues-api/v2/projects/${projectId}/issues/${issueId}/resolve`,
      'POST',
      { resolution }
    );
    return response.response.data;
  }

  // === VENDORS METHODS ===
  async listVendors(projectId) {
    const response = await this.makeRequest(
      `/vendors-api/v2/projects/${projectId}/vendors`
    );
    return response.response.data;
  }

  async assignVendorToJob(projectId, jobId, vendorData) {
    const response = await this.makeRequest(
      `/jobs-api/v3/projects/${projectId}/jobs/${jobId}/vendors`,
      'POST',
      vendorData
    );
    return response.response.data;
  }

  async getVendorDetails(projectId, vendorId) {
    const response = await this.makeRequest(
      `/vendors-api/v2/projects/${projectId}/vendors/${vendorId}`
    );
    return response.response.data;
  }

  // === ATTACHMENTS METHODS ===
  async uploadAttachment(projectId, attachmentData) {
    process.stderr.write(`DEBUG: Uploading attachment to project ${projectId}\n`);
    
    const response = await this.makeRequest(
      `/attachments-api/v2/projects/${projectId}/attachments`,
      'POST',
      attachmentData
    );
    return response.response.data;
  }

  async downloadAttachment(projectId, attachmentId) {
    const response = await this.makeRequest(
      `/attachments-api/v2/projects/${projectId}/attachments/${attachmentId}/download`
    );
    return response.response.data;
  }

  async listAttachments(projectId, stringHashcode = null) {
    let endpoint = `/attachments-api/v2/projects/${projectId}/attachments`;
    if (stringHashcode) {
      endpoint += `?stringHashcode=${stringHashcode}`;
    }
    
    const response = await this.makeRequest(endpoint);
    return response.response.data;
  }

  // === LOCALES METHODS ===
  async listLocales() {
    const response = await this.makeRequest('/locales-api/v2/dictionary');
    return response.response.data;
  }

  async addLocaleToProject(projectId, localeData) {
    const response = await this.makeRequest(
      `/projects-api/v2/projects/${projectId}/locales`,
      'POST',
      localeData
    );
    return response.response.data;
  }

  // === PEOPLE METHODS ===
  async listPeople(projectId) {
    const response = await this.makeRequest(
      `/accounts-api/v2/projects/${projectId}/people`
    );
    return response.response.data;
  }

  async createPerson(projectId, personData) {
    const response = await this.makeRequest(
      `/accounts-api/v2/projects/${projectId}/people`,
      'POST',
      personData
    );
    return response.response.data;
  }

  async getPerson(projectId, personId) {
    const response = await this.makeRequest(
      `/accounts-api/v2/projects/${projectId}/people/${personId}`
    );
    return response.response.data;
  }

  // === REPORTS METHODS ===
  async generateReport(projectId, reportData) {
    process.stderr.write(`DEBUG: Generating report for project ${projectId}\n`);
    
    const response = await this.makeRequest(
      `/reports-api/v2/projects/${projectId}/reports`,
      'POST',
      reportData
    );
    return response.response.data;
  }

  async listReports(projectId) {
    const response = await this.makeRequest(
      `/reports-api/v2/projects/${projectId}/reports`
    );
    return response.response.data;
  }

  async getReportDetails(projectId, reportId) {
    const response = await this.makeRequest(
      `/reports-api/v2/projects/${projectId}/reports/${reportId}`
    );
    return response.response.data;
  }
}

// === MCP SERVER ===
class SmartlingMCPServer {
  constructor() {
    this.client = null;
    this.setupClient();
  }

  setupClient() {
    const userIdentifier = process.env.SMARTLING_USER_IDENTIFIER;
    const userSecret = process.env.SMARTLING_USER_SECRET;
    const baseUrl = process.env.SMARTLING_BASE_URL || 'https://api.smartling.com';

    if (!userIdentifier || !userSecret) {
      process.stderr.write('Missing Smartling credentials\n');
      return;
    }

    this.client = new SmartlingClient({ userIdentifier, userSecret, baseUrl });
    // Add a note about project ID in debugging
    process.stderr.write('NOTE: If you get 404 errors, check your Project ID in Smartling dashboard\n');
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    console.log(JSON.stringify(response));
  }

  sendError(message, id = null) {
    const error = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -1,
        message
      }
    };
    console.log(JSON.stringify(error));
  }

  async handleInitialize(id, params) {
    this.sendResponse(id, {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'smartling-mcp-server',
        version: '3.0.0'
      }
    });
  }

  async handleListTools(id) {
    const tools = [
      {
        name: 'smartling_get_account_info',
        description: 'Get account information and available accounts',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_list_projects',
        description: 'List all available projects',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_get_project_details',
        description: 'Get details of a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_list_files',
        description: 'List all files in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_search_strings',
        description: 'Search for strings by content across files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            searchText: {
              type: 'string',
              description: 'Text to search for in strings'
            },
            localeId: {
              type: 'string',
              description: 'Optional: specific locale to search in'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)'
            }
          },
          required: ['projectId', 'searchText']
        }
      },
      {
        name: 'smartling_add_tag_to_string',
        description: 'Add a tag to a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcode: {
              type: 'string',
              description: 'The string hashcode identifier'
            },
            localeId: {
              type: 'string',
              description: 'The locale ID'
            },
            tag: {
              type: 'string',
              description: 'The tag to add'
            }
          },
          required: ['projectId', 'hashcode', 'localeId', 'tag']
        }
      },
      {
        name: 'smartling_get_string_tags',
        description: 'Get all tags for a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcode: {
              type: 'string',
              description: 'The string hashcode identifier'
            },
            localeId: {
              type: 'string',
              description: 'The locale ID'
            }
          },
          required: ['projectId', 'hashcode', 'localeId']
        }
      },
      {
        name: 'smartling_find_hashcode_for_key',
        description: 'Find the hashcode for a specific translation key by searching through project files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            keyName: {
              type: 'string',
              description: 'The exact key name to search for (e.g., "premium-google-workspace.success_page.business_email_section.free_trial.cta")'
            }
          },
          required: ['projectId', 'keyName']
        }
      },
      {
        name: 'smartling_add_tags_to_strings',
        description: 'Add tags to multiple translation strings at once using their hashcodes',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to tag'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of tags to add'
            }
          },
          required: ['projectId', 'hashcodes', 'tags']
        }
      },
      {
        name: 'smartling_search_and_tag',
        description: 'Find strings by search term and automatically add tags to them',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            searchText: {
              type: 'string',
              description: 'Text to search for in strings'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of tags to add to found strings'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of strings to process (default: 20)'
            }
          },
          required: ['projectId', 'searchText', 'tags']
        }
      },
      {
        name: 'smartling_find_latest_translations',
        description: 'Find the most recently translated strings in a specific locale',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            searchText: {
              type: 'string',
              description: 'Text to search for in strings'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)'
            }
          },
          required: ['projectId', 'searchText']
        }
      },
      {
        name: 'smartling_get_translation_stats',
        description: 'Get comprehensive translation statistics for a project including file counts, string counts, and top files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_get_all_project_tags',
        description: 'Get all available tags in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_get_strings_tags',
        description: 'Get tags for multiple strings by their hashcodes',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to get tags for'
            }
          },
          required: ['projectId', 'hashcodes']
        }
      },
      {
        name: 'smartling_find_duplicate_strings',
        description: 'Find duplicate strings across all project files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of duplicate groups to return (default: 50)'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_find_untranslated_strings',
        description: 'Find strings that are not translated in a specific locale',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            localeId: {
              type: 'string',
              description: 'The locale ID to check for missing translations (e.g., "es", "fr-FR")'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of untranslated strings to return (default: 50)'
            }
          },
          required: ['projectId', 'localeId']
        }
      },
      {
        name: 'smartling_find_keys_with_invalid_hashcode',
        description: 'Check which of the provided keys have invalid or non-existent hashcodes in Smartling',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            keysToCheck: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of translation keys to validate'
            }
          },
          required: ['projectId', 'keysToCheck']
        }
      },
      {
        name: 'smartling_get_string_file_content',
        description: 'Get the raw content of a specific translation file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'The file URI to get content from'
            }
          },
          required: ['projectId', 'fileUri']
        }
      },
      {
        name: 'smartling_search_with_regex',
        description: 'Search for strings using regular expressions (advanced pattern matching)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            regexPattern: {
              type: 'string',
              description: 'Regular expression pattern to search for (e.g., "^error\\.", ".*\\.title$")'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)'
            }
          },
          required: ['projectId', 'regexPattern']
        }
      },
      {
        name: 'smartling_get_context_bindings',
        description: 'Get context bindings (visual context associations) for specific strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to get context bindings for'
            }
          },
          required: ['projectId', 'hashcodes']
        }
      },
      {
        name: 'smartling_batch_operations',
        description: 'Execute multiple operations in batch (search, tag, findHashcode) for better performance',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['search', 'tag', 'findHashcode'],
                    description: 'Type of operation to perform'
                  },
                  searchText: {
                    type: 'string',
                    description: 'For search operations: text to search for'
                  },
                  hashcodes: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'For tag operations: hashcodes to tag'
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'For tag operations: tags to add'
                  },
                  keyName: {
                    type: 'string',
                    description: 'For findHashcode operations: key name to find'
                  },
                  limit: {
                    type: 'number',
                    description: 'For search operations: limit results'
                  }
                },
                required: ['type']
              },
              description: 'Array of operations to execute'
            }
          },
          required: ['projectId', 'operations']
        }
      },
      {
        name: 'smartling_get_all_source_strings_hashcodes',
        description: 'Get all source strings hashcodes from specific files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUris: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of file URIs to get hashcodes from'
            }
          },
          required: ['projectId', 'fileUris']
        }
      },
      {
        name: 'smartling_get_all_source_strings',
        description: 'Get all source strings from specific files with full details',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUris: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of file URIs to get strings from'
            }
          },
          required: ['projectId', 'fileUris']
        }
      },
      {
        name: 'smartling_get_access_token',
        description: 'Get current access token and expiration information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_list_all_translations',
        description: 'List all translations for specific strings in a target locale',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to get translations for'
            },
            localeId: {
              type: 'string',
              description: 'Target locale ID (e.g., "es", "fr-FR")'
            }
          },
          required: ['projectId', 'hashcodes', 'localeId']
        }
      },
      {
        name: 'smartling_resolve_strings_tags',
        description: 'Advanced method to resolve tags for strings with hashcode info',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodeInfos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  localeKey: {
                    type: 'string',
                    description: 'The locale key'
                  },
                  hashcode: {
                    type: 'string',
                    description: 'The string hashcode'
                  }
                },
                required: ['localeKey', 'hashcode']
              },
              description: 'Array of hashcode info objects'
            }
          },
          required: ['projectId', 'hashcodeInfos']
        }
      },
      {
        name: 'smartling_get_source_strings_hashes',
        description: 'Get hashcodes for specific locale keys from specific files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            localeKeys: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of locale keys to find hashcodes for'
            },
            fileUris: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of file URIs to search in'
            }
          },
          required: ['projectId', 'localeKeys', 'fileUris']
        }
      },
      {
        name: 'smartling_associate_strings_with_context',
        description: 'Associate translation strings with visual context (screenshots, designs)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to associate'
            },
            contextUid: {
              type: 'string',
              description: 'UID of the context to associate strings with'
            }
          },
          required: ['projectId', 'hashcodes', 'contextUid']
        }
      },
      {
        name: 'smartling_create_image_context',
        description: 'Create visual context from image content (placeholder implementation)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            imageContent: {
              type: 'string',
              description: 'Base64 encoded image content or file path'
            },
            fileName: {
              type: 'string',
              description: 'Optional filename for the context'
            }
          },
          required: ['projectId', 'imageContent']
        }
      },
      {
        name: 'smartling_resolve_source_strings_context_bindings',
        description: 'Get detailed context binding information for source strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcodes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of string hashcodes to get context bindings for'
            }
          },
          required: ['projectId', 'hashcodes']
        }
      },
      
      // === JOBS/WORKFLOWS TOOLS (5 new tools) ===
      {
        name: 'smartling_create_job',
        description: 'Create a new translation job in Smartling',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            jobName: {
              type: 'string',
              description: 'Name for the translation job'
            },
            targetLocaleIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target locale IDs for translation'
            },
            description: {
              type: 'string',
              description: 'Optional job description'
            },
            dueDate: {
              type: 'string',
              description: 'Due date in ISO format (YYYY-MM-DDTHH:MM:SSZ)'
            }
          },
          required: ['projectId', 'jobName', 'targetLocaleIds']
        }
      },
      {
        name: 'smartling_list_jobs',
        description: 'List all jobs in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            status: {
              type: 'string',
              description: 'Optional: filter by job status'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_get_job_details',
        description: 'Get details of a specific translation job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            jobId: {
              type: 'string',
              description: 'The job ID'
            }
          },
          required: ['projectId', 'jobId']
        }
      },
      {
        name: 'smartling_authorize_job',
        description: 'Authorize a translation job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            jobId: {
              type: 'string',
              description: 'The job ID'
            }
          },
          required: ['projectId', 'jobId']
        }
      },
      {
        name: 'smartling_close_job',
        description: 'Close a translation job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            jobId: {
              type: 'string',
              description: 'The job ID'
            }
          },
          required: ['projectId', 'jobId']
        }
      },

      // === FILE OPERATIONS TOOLS (4 new tools) ===
      {
        name: 'smartling_upload_file',
        description: 'Upload a file for translation',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'File URI in Smartling'
            },
            fileContent: {
              type: 'string',
              description: 'Base64 encoded file content'
            },
            fileType: {
              type: 'string',
              description: 'File type (json, xml, properties, etc.)'
            },
            authorize: {
              type: 'boolean',
              description: 'Whether to authorize immediately'
            }
          },
          required: ['projectId', 'fileUri', 'fileContent', 'fileType']
        }
      },
      {
        name: 'smartling_download_file',
        description: 'Download a translated file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'File URI in Smartling'
            },
            localeId: {
              type: 'string',
              description: 'Target locale ID'
            },
            retrievalType: {
              type: 'string',
              description: 'Retrieval type (published, pseudo, pending, etc.)'
            }
          },
          required: ['projectId', 'fileUri', 'localeId']
        }
      },
      {
        name: 'smartling_get_file_status',
        description: 'Get the translation status of a file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'File URI in Smartling'
            }
          },
          required: ['projectId', 'fileUri']
        }
      },
      {
        name: 'smartling_delete_file',
        description: 'Delete a file from project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'File URI in Smartling'
            }
          },
          required: ['projectId', 'fileUri']
        }
      },

      // === QUALITY ASSURANCE TOOLS (3 new tools) ===
      {
        name: 'smartling_run_quality_check',
        description: 'Run quality checks on translated content',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUris: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of file URIs to check'
            },
            localeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of locale IDs to check'
            },
            checkTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of check types (spelling, grammar, etc.)'
            }
          },
          required: ['projectId', 'fileUris', 'localeIds']
        }
      },
      {
        name: 'smartling_get_quality_check_report',
        description: 'Get quality check report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            checkId: {
              type: 'string',
              description: 'The quality check ID'
            }
          },
          required: ['projectId', 'checkId']
        }
      },
      {
        name: 'smartling_list_quality_checks',
        description: 'List all quality checks for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },

      // === GLOSSARY TOOLS (3 new tools) ===
      {
        name: 'smartling_get_glossaries',
        description: 'Get all glossaries in the account',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_create_glossary',
        description: 'Create a new glossary',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Glossary name'
            },
            description: {
              type: 'string',
              description: 'Glossary description'
            },
            sourceLocaleId: {
              type: 'string',
              description: 'Source locale ID'
            },
            targetLocaleIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of target locale IDs'
            }
          },
          required: ['name', 'sourceLocaleId']
        }
      },
      {
        name: 'smartling_create_glossary_term',
        description: 'Create a new glossary term',
        inputSchema: {
          type: 'object',
          properties: {
            glossaryId: {
              type: 'string',
              description: 'The glossary ID'
            },
            term: {
              type: 'string',
              description: 'The source term'
            },
            definition: {
              type: 'string',
              description: 'Term definition'
            },
            partOfSpeech: {
              type: 'string',
              description: 'Part of speech (noun, verb, etc.)'
            },
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  localeId: { type: 'string' },
                  translation: { type: 'string' }
                }
              },
              description: 'Array of translations for different locales'
            }
          },
          required: ['glossaryId', 'term', 'definition']
        }
      },

      // === WEBHOOK TOOLS (3 new tools) ===
      {
        name: 'smartling_create_webhook',
        description: 'Create a new webhook for project events',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            url: {
              type: 'string',
              description: 'Webhook URL'
            },
            events: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of event types to subscribe to'
            },
            httpMethod: {
              type: 'string',
              description: 'HTTP method (POST, GET, etc.)'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the webhook is enabled'
            }
          },
          required: ['projectId', 'url', 'events']
        }
      },
      {
        name: 'smartling_list_webhooks',
        description: 'List all webhooks for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_delete_webhook',
        description: 'Delete a webhook',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            webhookUid: {
              type: 'string',
              description: 'The webhook UID'
            }
          },
          required: ['projectId', 'webhookUid']
        }
      },

      // === UTILITY TOOLS (5 new tools) ===
      {
        name: 'smartling_diagnostic',
        description: 'Run diagnostic tests on Smartling API connection and authentication',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_create_project',
        description: 'Create a new translation project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Project name'
            },
            sourceLocaleId: {
              type: 'string',
              description: 'Source locale ID'
            },
            targetLocaleIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of target locale IDs'
            },
            projectTypeCode: {
              type: 'string',
              description: 'Project type code'
            }
          },
          required: ['projectName', 'sourceLocaleId', 'targetLocaleIds']
        }
      },
      {
        name: 'smartling_remove_tag_from_string',
        description: 'Remove a tag from a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            hashcode: {
              type: 'string',
              description: 'The string hashcode identifier'
            },
            localeId: {
              type: 'string',
              description: 'The locale ID'
            },
            tag: {
              type: 'string',
              description: 'The tag to remove'
            }
          },
          required: ['projectId', 'hashcode', 'localeId', 'tag']
        }
      },
      {
        name: 'smartling_get_workflow_steps',
        description: 'Get workflow steps for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_resolve_locales_last_modified',
        description: 'Get last modified dates for all locales of a specific file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileUri: {
              type: 'string',
              description: 'File URI in Smartling'
            }
          },
          required: ['projectId', 'fileUri']
        }
      },

      // === ESTIMATES TOOLS (3 new tools) ===
      {
        name: 'smartling_create_estimate',
        description: 'Create a new translation estimate',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            name: {
              type: 'string',
              description: 'Estimate name'
            },
            fileUris: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of file URIs to estimate'
            },
            targetLocaleIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target locale IDs for estimation'
            }
          },
          required: ['projectId', 'name', 'fileUris', 'targetLocaleIds']
        }
      },
      {
        name: 'smartling_get_estimate_details',
        description: 'Get details of a specific estimate',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            estimateId: {
              type: 'string',
              description: 'The estimate ID'
            }
          },
          required: ['projectId', 'estimateId']
        }
      },
      {
        name: 'smartling_list_estimates',
        description: 'List all estimates in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            status: {
              type: 'string',
              description: 'Optional: filter by estimate status'
            }
          },
          required: ['projectId']
        }
      },

      // === ISSUES TOOLS (4 new tools) ===
      {
        name: 'smartling_create_issue',
        description: 'Create a new issue/bug report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            title: {
              type: 'string',
              description: 'Issue title'
            },
            description: {
              type: 'string',
              description: 'Issue description'
            },
            stringHashcode: {
              type: 'string',
              description: 'Optional: related string hashcode'
            },
            priority: {
              type: 'string',
              description: 'Issue priority (low, medium, high, critical)'
            }
          },
          required: ['projectId', 'title', 'description']
        }
      },
      {
        name: 'smartling_list_issues',
        description: 'List all issues in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            status: {
              type: 'string',
              description: 'Optional: filter by issue status'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_get_issue_details',
        description: 'Get details of a specific issue',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            issueId: {
              type: 'string',
              description: 'The issue ID'
            }
          },
          required: ['projectId', 'issueId']
        }
      },
      {
        name: 'smartling_resolve_issue',
        description: 'Resolve an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            issueId: {
              type: 'string',
              description: 'The issue ID'
            },
            resolution: {
              type: 'string',
              description: 'Resolution description'
            }
          },
          required: ['projectId', 'issueId', 'resolution']
        }
      },

      // === VENDORS TOOLS (3 new tools) ===
      {
        name: 'smartling_list_vendors',
        description: 'List all vendors/translators for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_assign_vendor_to_job',
        description: 'Assign a vendor/translator to a translation job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            jobId: {
              type: 'string',
              description: 'The job ID'
            },
            vendorId: {
              type: 'string',
              description: 'The vendor ID'
            },
            localeId: {
              type: 'string',
              description: 'Target locale for assignment'
            }
          },
          required: ['projectId', 'jobId', 'vendorId', 'localeId']
        }
      },
      {
        name: 'smartling_get_vendor_details',
        description: 'Get details of a specific vendor/translator',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            vendorId: {
              type: 'string',
              description: 'The vendor ID'
            }
          },
          required: ['projectId', 'vendorId']
        }
      },

      // === ATTACHMENTS TOOLS (3 new tools) ===
      {
        name: 'smartling_upload_attachment',
        description: 'Upload an attachment/reference file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            fileName: {
              type: 'string',
              description: 'Attachment filename'
            },
            fileContent: {
              type: 'string',
              description: 'Base64 encoded file content'
            },
            stringHashcode: {
              type: 'string',
              description: 'Optional: associate with specific string'
            }
          },
          required: ['projectId', 'fileName', 'fileContent']
        }
      },
      {
        name: 'smartling_download_attachment',
        description: 'Download an attachment file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            attachmentId: {
              type: 'string',
              description: 'The attachment ID'
            }
          },
          required: ['projectId', 'attachmentId']
        }
      },
      {
        name: 'smartling_list_attachments',
        description: 'List all attachments in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            stringHashcode: {
              type: 'string',
              description: 'Optional: filter by associated string'
            }
          },
          required: ['projectId']
        }
      },

      // === LOCALES TOOLS (2 new tools) ===
      {
        name: 'smartling_list_locales',
        description: 'List all available locales in Smartling',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_add_locale_to_project',
        description: 'Add a new locale to a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            localeId: {
              type: 'string',
              description: 'Locale ID to add (e.g., "es-ES", "fr-FR")'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the locale should be enabled'
            }
          },
          required: ['projectId', 'localeId']
        }
      },

      // === PEOPLE TOOLS (3 new tools) ===
      {
        name: 'smartling_list_people',
        description: 'List all people/users in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_create_person',
        description: 'Create/invite a new person to the project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            email: {
              type: 'string',
              description: 'Person email address'
            },
            role: {
              type: 'string',
              description: 'User role (translator, reviewer, manager, etc.)'
            },
            localeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Locale IDs the person can work with'
            }
          },
          required: ['projectId', 'email', 'role']
        }
      },
      {
        name: 'smartling_get_person',
        description: 'Get details of a specific person/user',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            personId: {
              type: 'string',
              description: 'The person ID'
            }
          },
          required: ['projectId', 'personId']
        }
      },

      // === REPORTS TOOLS (3 new tools) ===
      {
        name: 'smartling_generate_report',
        description: 'Generate a new report with specified parameters',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            reportType: {
              type: 'string',
              description: 'Type of report (progress, quality, cost, etc.)'
            },
            dateFrom: {
              type: 'string',
              description: 'Start date for report (YYYY-MM-DD format)'
            },
            dateTo: {
              type: 'string',
              description: 'End date for report (YYYY-MM-DD format)'
            },
            localeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: specific locales to include'
            }
          },
          required: ['projectId', 'reportType', 'dateFrom', 'dateTo']
        }
      },
      {
        name: 'smartling_list_reports',
        description: 'List all reports in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'smartling_get_report_details',
        description: 'Get details and download link for a specific report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID'
            },
            reportId: {
              type: 'string',
              description: 'The report ID'
            }
          },
          required: ['projectId', 'reportId']
        }
      }
    ];

    this.sendResponse(id, { tools });
  }

  async handleCallTool(id, params) {
    const { name, arguments: args } = params;

    if (!this.client) {
      this.sendError('Smartling client not configured. Check environment variables.', id);
      return;
    }

    try {
      let result;
      
      switch (name) {
        case 'smartling_get_account_info':
          result = await this.client.getAccountInfo();
          break;

        case 'smartling_list_projects':
          result = await this.client.listProjects();
          break;

        case 'smartling_get_project_details':
          if (!args.projectId) throw new Error('projectId is required');
          result = await this.client.getProjectDetails(args.projectId);
          break;

        case 'smartling_list_files':
          if (!args.projectId) throw new Error('projectId is required');
          result = await this.client.listFiles(args.projectId);
          break;

        case 'smartling_search_strings':
          if (!args.projectId || !args.searchText) throw new Error('projectId and searchText are required');
          result = await this.client.searchStrings(
            args.projectId,
            args.searchText,
            args.localeId || null,
            args.limit || 50
          );
          break;

        case 'smartling_add_tag_to_string':
          if (!args.projectId || !args.hashcode || !args.localeId || !args.tag) {
            throw new Error('projectId, hashcode, localeId, and tag are required');
          }
          result = await this.client.addTagToString(
            args.projectId,
            args.hashcode,
            args.localeId,
            args.tag
          );
          break;

        case 'smartling_get_string_tags':
          if (!args.projectId || !args.hashcode || !args.localeId) {
            throw new Error('projectId, hashcode, and localeId are required');
          }
          result = await this.client.getStringTags(
            args.projectId,
            args.hashcode,
            args.localeId
          );
          break;

        case 'smartling_find_hashcode_for_key':
          if (!args.projectId || !args.keyName) {
            throw new Error('projectId and keyName are required');
          }
          result = await this.client.findHashcodeForKey(
            args.projectId,
            args.keyName
          );
          break;

        case 'smartling_add_tags_to_strings':
          if (!args.projectId || !args.hashcodes || !args.tags) {
            throw new Error('projectId, hashcodes, and tags are required');
          }
          result = await this.client.addTagsToStrings(
            args.projectId,
            args.hashcodes,
            args.tags
          );
          break;

        case 'smartling_search_and_tag':
          if (!args.projectId || !args.searchText || !args.tags) {
            throw new Error('projectId, searchText, and tags are required');
          }
          result = await this.client.searchAndTag(
            args.projectId,
            args.searchText,
            args.tags,
            args.limit || 20
          );
          break;

        case 'smartling_find_latest_translations':
          if (!args.projectId || !args.searchText) {
            throw new Error('projectId and searchText are required');
          }
          result = await this.client.findLatestTranslations(
            args.projectId,
            args.searchText,
            args.limit || 10
          );
          break;

        case 'smartling_get_translation_stats':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.getTranslationStats(args.projectId);
          break;

        case 'smartling_get_all_project_tags':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.getAllProjectTags(args.projectId);
          break;

        case 'smartling_get_strings_tags':
          if (!args.projectId || !args.hashcodes) {
            throw new Error('projectId and hashcodes are required');
          }
          result = await this.client.getStringTags(args.projectId, args.hashcodes);
          break;

        case 'smartling_find_duplicate_strings':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.findDuplicateStrings(
            args.projectId,
            args.limit || 50
          );
          break;

        case 'smartling_find_untranslated_strings':
          if (!args.projectId || !args.localeId) {
            throw new Error('projectId and localeId are required');
          }
          result = await this.client.findUntranslatedStrings(
            args.projectId,
            args.localeId,
            args.limit || 50
          );
          break;

        case 'smartling_find_keys_with_invalid_hashcode':
          if (!args.projectId || !args.keysToCheck) {
            throw new Error('projectId and keysToCheck are required');
          }
          result = await this.client.findKeysWithInvalidHashcode(
            args.projectId,
            args.keysToCheck
          );
          break;

        case 'smartling_get_string_file_content':
          if (!args.projectId || !args.fileUri) {
            throw new Error('projectId and fileUri are required');
          }
          result = await this.client.getStringFileContent(
            args.projectId,
            args.fileUri
          );
          break;

        case 'smartling_search_with_regex':
          if (!args.projectId || !args.regexPattern) {
            throw new Error('projectId and regexPattern are required');
          }
          result = await this.client.searchWithRegex(
            args.projectId,
            args.regexPattern,
            args.limit || 50
          );
          break;

        case 'smartling_get_context_bindings':
          if (!args.projectId || !args.hashcodes) {
            throw new Error('projectId and hashcodes are required');
          }
          result = await this.client.getContextBindings(
            args.projectId,
            args.hashcodes
          );
          break;

        case 'smartling_batch_operations':
          if (!args.projectId || !args.operations) {
            throw new Error('projectId and operations are required');
          }
          result = await this.client.batchOperations(
            args.projectId,
            args.operations
          );
          break;

        case 'smartling_get_all_source_strings_hashcodes':
          if (!args.projectId || !args.fileUris) {
            throw new Error('projectId and fileUris are required');
          }
          result = await this.client.getAllSourceStringsHashcodes(
            args.projectId,
            args.fileUris
          );
          break;

        case 'smartling_get_all_source_strings':
          if (!args.projectId || !args.fileUris) {
            throw new Error('projectId and fileUris are required');
          }
          result = await this.client.getAllSourceStrings(
            args.projectId,
            args.fileUris
          );
          break;

        case 'smartling_get_access_token':
          result = await this.client.getAccessToken();
          break;

        case 'smartling_list_all_translations':
          if (!args.projectId || !args.hashcodes || !args.localeId) {
            throw new Error('projectId, hashcodes, and localeId are required');
          }
          result = await this.client.listAllTranslations(
            args.projectId,
            args.hashcodes,
            args.localeId
          );
          break;

        case 'smartling_resolve_strings_tags':
          if (!args.projectId || !args.hashcodeInfos) {
            throw new Error('projectId and hashcodeInfos are required');
          }
          result = await this.client.resolveStringsTags(
            args.projectId,
            args.hashcodeInfos
          );
          break;

        case 'smartling_get_source_strings_hashes':
          if (!args.projectId || !args.localeKeys || !args.fileUris) {
            throw new Error('projectId, localeKeys, and fileUris are required');
          }
          result = await this.client.getSourceStringsHashes(
            args.projectId,
            args.localeKeys,
            args.fileUris
          );
          break;

        case 'smartling_associate_strings_with_context':
          if (!args.projectId || !args.hashcodes || !args.contextUid) {
            throw new Error('projectId, hashcodes, and contextUid are required');
          }
          result = await this.client.associateStringsWithContext(
            args.projectId,
            args.hashcodes,
            args.contextUid
          );
          break;

        case 'smartling_create_image_context':
          if (!args.projectId || !args.imageContent) {
            throw new Error('projectId and imageContent are required');
          }
          result = await this.client.createImageContext(
            args.projectId,
            args.imageContent,
            args.fileName
          );
          break;

        case 'smartling_resolve_source_strings_context_bindings':
          if (!args.projectId || !args.hashcodes) {
            throw new Error('projectId and hashcodes are required');
          }
          result = await this.client.resolveSourceStringsContextBindings(
            args.projectId,
            args.hashcodes
          );
          break;

        // === JOBS/WORKFLOWS HANDLERS ===
        case 'smartling_create_job':
          if (!args.projectId || !args.jobName || !args.targetLocaleIds) {
            throw new Error('projectId, jobName, and targetLocaleIds are required');
          }
          result = await this.client.createJob(args.projectId, {
            jobName: args.jobName,
            targetLocaleIds: args.targetLocaleIds,
            description: args.description,
            dueDate: args.dueDate
          });
          break;

        case 'smartling_list_jobs':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listJobs(args.projectId, args.status);
          break;

        case 'smartling_get_job_details':
          if (!args.projectId || !args.jobId) {
            throw new Error('projectId and jobId are required');
          }
          result = await this.client.getJobDetails(args.projectId, args.jobId);
          break;

        case 'smartling_authorize_job':
          if (!args.projectId || !args.jobId) {
            throw new Error('projectId and jobId are required');
          }
          result = await this.client.authorizeJob(args.projectId, args.jobId);
          break;

        case 'smartling_close_job':
          if (!args.projectId || !args.jobId) {
            throw new Error('projectId and jobId are required');
          }
          result = await this.client.closeJob(args.projectId, args.jobId);
          break;

        // === FILE OPERATIONS HANDLERS ===
        case 'smartling_upload_file':
          if (!args.projectId || !args.fileUri || !args.fileContent || !args.fileType) {
            throw new Error('projectId, fileUri, fileContent, and fileType are required');
          }
          result = await this.client.uploadFile(args.projectId, {
            fileUri: args.fileUri,
            fileContent: args.fileContent,
            fileType: args.fileType,
            authorize: args.authorize
          });
          break;

        case 'smartling_download_file':
          if (!args.projectId || !args.fileUri || !args.localeId) {
            throw new Error('projectId, fileUri, and localeId are required');
          }
          result = await this.client.downloadFile(
            args.projectId,
            args.fileUri,
            args.localeId,
            { retrievalType: args.retrievalType }
          );
          break;

        case 'smartling_get_file_status':
          if (!args.projectId || !args.fileUri) {
            throw new Error('projectId and fileUri are required');
          }
          result = await this.client.getFileStatus(args.projectId, args.fileUri);
          break;

        case 'smartling_delete_file':
          if (!args.projectId || !args.fileUri) {
            throw new Error('projectId and fileUri are required');
          }
          result = await this.client.deleteFile(args.projectId, args.fileUri);
          break;

        // === QUALITY ASSURANCE HANDLERS ===
        case 'smartling_run_quality_check':
          if (!args.projectId || !args.fileUris || !args.localeIds) {
            throw new Error('projectId, fileUris, and localeIds are required');
          }
          result = await this.client.runQualityCheck(
            args.projectId,
            args.fileUris,
            args.localeIds,
            args.checkTypes
          );
          break;

        case 'smartling_get_quality_check_report':
          if (!args.projectId || !args.checkId) {
            throw new Error('projectId and checkId are required');
          }
          result = await this.client.getQualityCheckReport(args.projectId, args.checkId);
          break;

        case 'smartling_list_quality_checks':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listQualityChecks(args.projectId);
          break;

        // === GLOSSARY HANDLERS ===
        case 'smartling_get_glossaries':
          result = await this.client.getGlossaries();
          break;

        case 'smartling_create_glossary':
          if (!args.name || !args.sourceLocaleId) {
            throw new Error('name and sourceLocaleId are required');
          }
          result = await this.client.createGlossary({
            name: args.name,
            description: args.description,
            sourceLocaleId: args.sourceLocaleId,
            targetLocaleIds: args.targetLocaleIds
          });
          break;

        case 'smartling_create_glossary_term':
          if (!args.glossaryId || !args.term || !args.definition) {
            throw new Error('glossaryId, term, and definition are required');
          }
          result = await this.client.createGlossaryTerm(args.glossaryId, {
            term: args.term,
            definition: args.definition,
            partOfSpeech: args.partOfSpeech,
            translations: args.translations
          });
          break;

        // === WEBHOOK HANDLERS ===
        case 'smartling_create_webhook':
          if (!args.projectId || !args.url || !args.events) {
            throw new Error('projectId, url, and events are required');
          }
          result = await this.client.createWebhook(args.projectId, {
            url: args.url,
            events: args.events,
            httpMethod: args.httpMethod,
            enabled: args.enabled
          });
          break;

        case 'smartling_list_webhooks':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listWebhooks(args.projectId);
          break;

        case 'smartling_delete_webhook':
          if (!args.projectId || !args.webhookUid) {
            throw new Error('projectId and webhookUid are required');
          }
          result = await this.client.deleteWebhook(args.projectId, args.webhookUid);
          break;

        // === UTILITY HANDLERS ===
        case 'smartling_diagnostic':
          result = await this.client.diagnostic();
          break;

        case 'smartling_create_project':
          if (!args.projectName || !args.sourceLocaleId || !args.targetLocaleIds) {
            throw new Error('projectName, sourceLocaleId, and targetLocaleIds are required');
          }
          result = await this.client.createProject({
            projectName: args.projectName,
            sourceLocaleId: args.sourceLocaleId,
            targetLocaleIds: args.targetLocaleIds,
            projectTypeCode: args.projectTypeCode
          });
          break;

        case 'smartling_remove_tag_from_string':
          if (!args.projectId || !args.hashcode || !args.localeId || !args.tag) {
            throw new Error('projectId, hashcode, localeId, and tag are required');
          }
          result = await this.client.removeTagFromString(
            args.projectId,
            args.hashcode,
            args.localeId,
            args.tag
          );
          break;

        case 'smartling_get_workflow_steps':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.getWorkflowSteps(args.projectId);
          break;

        case 'smartling_resolve_locales_last_modified':
          if (!args.projectId || !args.fileUri) {
            throw new Error('projectId and fileUri are required');
          }
          result = await this.client.resolveLocalesLastModified(args.projectId, args.fileUri);
          break;

        // === ESTIMATES HANDLERS ===
        case 'smartling_create_estimate':
          if (!args.projectId || !args.name || !args.fileUris || !args.targetLocaleIds) {
            throw new Error('projectId, name, fileUris, and targetLocaleIds are required');
          }
          result = await this.client.createEstimate(args.projectId, {
            name: args.name,
            fileUris: args.fileUris,
            targetLocaleIds: args.targetLocaleIds
          });
          break;

        case 'smartling_get_estimate_details':
          if (!args.projectId || !args.estimateId) {
            throw new Error('projectId and estimateId are required');
          }
          result = await this.client.getEstimateDetails(args.projectId, args.estimateId);
          break;

        case 'smartling_list_estimates':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listEstimates(args.projectId, args.status);
          break;

        // === ISSUES HANDLERS ===
        case 'smartling_create_issue':
          if (!args.projectId || !args.title || !args.description) {
            throw new Error('projectId, title, and description are required');
          }
          result = await this.client.createIssue(args.projectId, {
            title: args.title,
            description: args.description,
            stringHashcode: args.stringHashcode,
            priority: args.priority
          });
          break;

        case 'smartling_list_issues':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listIssues(args.projectId, args.status);
          break;

        case 'smartling_get_issue_details':
          if (!args.projectId || !args.issueId) {
            throw new Error('projectId and issueId are required');
          }
          result = await this.client.getIssueDetails(args.projectId, args.issueId);
          break;

        case 'smartling_resolve_issue':
          if (!args.projectId || !args.issueId || !args.resolution) {
            throw new Error('projectId, issueId, and resolution are required');
          }
          result = await this.client.resolveIssue(args.projectId, args.issueId, args.resolution);
          break;

        // === VENDORS HANDLERS ===
        case 'smartling_list_vendors':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listVendors(args.projectId);
          break;

        case 'smartling_assign_vendor_to_job':
          if (!args.projectId || !args.jobId || !args.vendorId || !args.localeId) {
            throw new Error('projectId, jobId, vendorId, and localeId are required');
          }
          result = await this.client.assignVendorToJob(args.projectId, args.jobId, {
            vendorId: args.vendorId,
            localeId: args.localeId
          });
          break;

        case 'smartling_get_vendor_details':
          if (!args.projectId || !args.vendorId) {
            throw new Error('projectId and vendorId are required');
          }
          result = await this.client.getVendorDetails(args.projectId, args.vendorId);
          break;

        // === ATTACHMENTS HANDLERS ===
        case 'smartling_upload_attachment':
          if (!args.projectId || !args.fileName || !args.fileContent) {
            throw new Error('projectId, fileName, and fileContent are required');
          }
          result = await this.client.uploadAttachment(args.projectId, {
            fileName: args.fileName,
            fileContent: args.fileContent,
            stringHashcode: args.stringHashcode
          });
          break;

        case 'smartling_download_attachment':
          if (!args.projectId || !args.attachmentId) {
            throw new Error('projectId and attachmentId are required');
          }
          result = await this.client.downloadAttachment(args.projectId, args.attachmentId);
          break;

        case 'smartling_list_attachments':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listAttachments(args.projectId, args.stringHashcode);
          break;

        // === LOCALES HANDLERS ===
        case 'smartling_list_locales':
          result = await this.client.listLocales();
          break;

        case 'smartling_add_locale_to_project':
          if (!args.projectId || !args.localeId) {
            throw new Error('projectId and localeId are required');
          }
          result = await this.client.addLocaleToProject(args.projectId, {
            localeId: args.localeId,
            enabled: args.enabled !== undefined ? args.enabled : true
          });
          break;

        // === PEOPLE HANDLERS ===
        case 'smartling_list_people':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listPeople(args.projectId);
          break;

        case 'smartling_create_person':
          if (!args.projectId || !args.email || !args.role) {
            throw new Error('projectId, email, and role are required');
          }
          result = await this.client.createPerson(args.projectId, {
            email: args.email,
            role: args.role,
            localeIds: args.localeIds
          });
          break;

        case 'smartling_get_person':
          if (!args.projectId || !args.personId) {
            throw new Error('projectId and personId are required');
          }
          result = await this.client.getPerson(args.projectId, args.personId);
          break;

        // === REPORTS HANDLERS ===
        case 'smartling_generate_report':
          if (!args.projectId || !args.reportType || !args.dateFrom || !args.dateTo) {
            throw new Error('projectId, reportType, dateFrom, and dateTo are required');
          }
          result = await this.client.generateReport(args.projectId, {
            reportType: args.reportType,
            dateFrom: args.dateFrom,
            dateTo: args.dateTo,
            localeIds: args.localeIds
          });
          break;

        case 'smartling_list_reports':
          if (!args.projectId) {
            throw new Error('projectId is required');
          }
          result = await this.client.listReports(args.projectId);
          break;

        case 'smartling_get_report_details':
          if (!args.projectId || !args.reportId) {
            throw new Error('projectId and reportId are required');
          }
          result = await this.client.getReportDetails(args.projectId, args.reportId);
          break;

        default:
          this.sendError(`Unknown tool: ${name}`, id);
          return;
      }

      this.sendResponse(id, {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      });

    } catch (error) {
      this.sendError(`Tool execution failed: ${error.message}`, id);
    }
  }

  async handleMessage(message) {
    try {
      const { jsonrpc, id, method, params } = JSON.parse(message);

      if (jsonrpc !== '2.0') {
        this.sendError('Invalid JSON-RPC version', id);
        return;
      }

      switch (method) {
        case 'initialize':
          await this.handleInitialize(id, params);
          break;
        case 'tools/list':
          await this.handleListTools(id);
          break;
        case 'tools/call':
          await this.handleCallTool(id, params);
          break;
        default:
          this.sendError(`Unknown method: ${method}`, id);
      }
    } catch (error) {
      this.sendError(`Invalid JSON-RPC message: ${error.message}`);
    }
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        this.handleMessage(line.trim());
      }
    });

    process.stderr.write('Smartling MCP Server started (simplified)\n');
  }
}

// Start the server
const server = new SmartlingMCPServer();
server.start(); 