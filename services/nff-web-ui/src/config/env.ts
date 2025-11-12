interface EnvConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  app: {
    env: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

interface RuntimeConfig {
  apiUrl: string;
  env: string;
}

const getEnvConfig = (runtimeConfig?: RuntimeConfig): EnvConfig => {
  const apiUrl =
    runtimeConfig?.apiUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    (typeof window !== 'undefined' ? '' : 'http://localhost:3000/api');

  const timeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;
  const env =
    runtimeConfig?.env ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NODE_ENV ||
    "development";

  return {
    api: {
      baseUrl: apiUrl,
      timeout,
    },
    app: {
      env,
      isDevelopment: env === "development",
      isProduction: env === "production",
    },
  };
};

export const ENV = getEnvConfig();

export const createEnvConfig = (runtimeConfig?: RuntimeConfig) =>
  getEnvConfig(runtimeConfig);



