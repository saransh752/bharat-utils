import type { SchemaRule } from './index';
import type { ValidateRequestOptions } from './express';

export function validateRequest(
  schema: Record<string, SchemaRule>,
  options?: ValidateRequestOptions
): (ctx: any, next: () => Promise<unknown>) => Promise<unknown>;
