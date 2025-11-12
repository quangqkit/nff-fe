import { registerAs } from '@nestjs/config';

export default registerAs('services', () => ({
  dataIngestion: {
    url:
      process.env.DATA_INGESTION_SERVICE_URL ||
      process.env.PYTHON_SERVICE_URL ||
      'http://localhost:8000',
    timeout: parseInt(process.env.DATA_INGESTION_TIMEOUT || '300000', 10),
  },
  lobstr: {
    apiKey: process.env.LOBSTR_API_KEY,
    baseUrl: process.env.LOBSTR_BASE_URL || 'https://api.lobstr.io',
  },
}));
