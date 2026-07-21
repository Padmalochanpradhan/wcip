export interface DataSourceParam {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect';
  options?: { label: string; value: string }[];
  default?: string;
  hint?: string;
  required?: boolean;
}

export interface DataResult {
  headers: string[];
  rows: string[][];
  total: number;
  source: string;
  vintage?: string;
  url?: string;
  fetchedAt: Date;
}

export interface DataSourcePlugin {
  id: string;
  name: string;
  description: string;
  docsUrl?: string;
  category: string;
  parameters: DataSourceParam[];
  /** Build the external API URL to proxy. Called by DataSourceService. */
  buildProxyRequest(params: Record<string, string>): { externalUrl: string };
  /** Parse the raw response from the external API into DataResult. */
  parseResult(raw: any, externalUrl: string, params: Record<string, string>): DataResult;
}
