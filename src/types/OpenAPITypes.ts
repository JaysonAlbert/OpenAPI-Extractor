export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: PathItem;
  };
  components?: {
    schemas?: {
      [key: string]: any;
    };
    parameters?: {
      [key: string]: any;
    };
    responses?: {
      [key: string]: any;
    };
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: {
    [statusCode: string]: Response;
  };
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: any;
}

export interface RequestBody {
  description?: string;
  content: {
    [mediaType: string]: {
      schema: any;
    };
  };
}

export interface Response {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: any;
    };
  };
} 