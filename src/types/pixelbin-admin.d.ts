declare module "@pixelbin/admin" {
  export class PixelbinConfig {
    constructor(config: { domain: string; apiSecret: string });
  }

  export class PixelbinClient {
    constructor(config: PixelbinConfig);
    assets: {
      fileUpload(params: {
        file?: unknown;
        path?: string;
        name?: string;
        access?: "public-read" | "private";
        tags?: string[];
        metadata?: Record<string, unknown>;
        overwrite?: boolean;
        filenameOverride?: boolean;
        options?: { originalFilename?: string };
      }): Promise<{
        url?: string;
        path?: string;
        name?: string;
        format?: string;
      }>;
      urlUpload(params: {
        url: string;
        path?: string;
        name?: string;
        access?: "public-read" | "private";
        tags?: string[];
        metadata?: Record<string, unknown>;
        overwrite?: boolean;
        filenameOverride?: boolean;
      }): Promise<{
        url?: string;
        path?: string;
        name?: string;
        format?: string;
      }>;
    };
    organization: {
      getAppOrgDetails(): Promise<{
        org?: {
          name?: string;
          cloudName?: string;
        };
      }>;
    };
    billing: {
      getUsageV2(): Promise<{
        credits?: {
          total?: number;
          used?: number;
        };
      }>;
    };
    predictions: {
      list(): Promise<unknown[]>;
      getSchema(name: string): Promise<unknown>;
      create(params: {
        name: string;
        input?: Record<string, unknown>;
        webhook?: string;
      }): Promise<{ _id: string; status: string }>;
      get(id: string): Promise<{
        _id: string;
        status: "SUCCESS" | "FAILURE" | "PROCESSING" | "PENDING";
        output?: Record<string, unknown> | string[];
        error?: string;
      }>;
      wait(
        id: string,
        options?: { maxAttempts?: number; retryInterval?: number }
      ): Promise<{
        _id: string;
        status: "SUCCESS" | "FAILURE" | "PROCESSING" | "PENDING";
        output?: Record<string, unknown> | string[];
        error?: string;
      }>;
      createAndWait(params: {
        name: string;
        input?: Record<string, unknown>;
        webhook?: string;
        options?: { maxAttempts?: number; retryFactor?: number; retryInterval?: number };
      }): Promise<{
        _id: string;
        status: "SUCCESS" | "FAILURE" | "PROCESSING" | "PENDING";
        output?: Record<string, unknown> | string[];
        error?: string;
      }>;
    };
  }
}
