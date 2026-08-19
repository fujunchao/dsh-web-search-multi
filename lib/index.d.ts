import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { StreamChunk } from '@deepseek-ai/dsh-llm';
import type { WebSearchProvider } from '@deepseek-ai/dsh-web';

export declare const name = 'web-search-multi';
export declare const inject: string[];

export interface BackendConfig {
  apiKey?: string;
  apiKeyEnv?: string;
  baseURL?: string;
  model?: string;
  maxResults?: number;
  searchDepth?: string;
  includeAnswer?: boolean;
}

export interface Config {
  provider?: 'tavily' | 'grok' | 'openai' | 'gemini';
  tavily?: BackendConfig;
  grok?: BackendConfig;
  openai?: BackendConfig;
  gemini?: BackendConfig;
}

export declare const Config: z<Config>;
export declare const MULTI_SETTINGS_NAMESPACE: unknown;
export declare function stabilizeToolCallIdentity(stream: AsyncIterable<StreamChunk>): AsyncGenerator<StreamChunk>;
export declare class MultiSearchProvider implements WebSearchProvider {
  readonly id: string;
  constructor(resolveOptions: () => unknown);
  available(): boolean;
  search(request: import('@deepseek-ai/dsh-web').WebSearchRequest, signal?: AbortSignal): Promise<import('@deepseek-ai/dsh-web').WebSearchResult>;
}
export declare function apply(ctx: Context, config: Config): void;
