import { Injectable, Logger } from '@nestjs/common';

const JUDGE0_URL = 'https://ce.judge0.com';
const LANGUAGE_MAP: Record<string, number> = { c: 50, cpp: 54, java: 62, python: 71 };

@Injectable()
export class Judge0Service {
  private readonly logger = new Logger(Judge0Service.name);

  getLanguageId(language: string): number {
    const id = LANGUAGE_MAP[language];
    if (!id) throw new Error(`Unsupported language: ${language}`);
    return id;
  }

  async runCode(language: string, code: string, stdin: string, timeLimit: number, memoryLimit: number) {
    const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: this.getLanguageId(language),
        source_code: code,
        stdin: stdin || '',
        cpu_time_limit: timeLimit,
        memory_limit: memoryLimit * 1024,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Judge0 HTTP ${res.status}: ${text}`);
      throw new Error(`Judge0 responded with HTTP ${res.status}`);
    }
    return res.json();
  }

  isAccepted(id: number) { return id === 3; }
  isCompilationError(id: number) { return id === 6; }
  isTLE(id: number) { return id === 5; }
  isRuntimeError(id: number) { return id >= 7 && id <= 12; }
}
