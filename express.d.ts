import type { SchemaRule } from './index';

export interface ValidateRequestOptions {
  source?: 'body' | 'query' | 'params';
  lang?: 'en' | 'hi';
}

export function validateRequest(
  schema: Record<string, SchemaRule>,
  options?: ValidateRequestOptions
): (req: any, res: any, next: (err?: any) => void) => any;
