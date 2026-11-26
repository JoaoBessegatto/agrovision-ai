interface RuntimeConfig {
  mapboxAccessToken?: string;
  maptilerApiKey?: string;
}

export const RUNTIME_CONFIG: RuntimeConfig = (
  globalThis as typeof globalThis & { AGROVISION_CONFIG?: RuntimeConfig }
).AGROVISION_CONFIG ?? {};
