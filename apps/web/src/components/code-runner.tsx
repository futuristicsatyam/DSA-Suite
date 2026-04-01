'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play, RotateCcw, Copy, Check, ChevronDown,
  Loader2, Terminal, AlertCircle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  {
    id: 'cpp',
    label: 'C++',
    judge0Id: 54,
    color: 'bg-blue-400',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {

    // Write your C++ code here

    return 0;
}`,
  },
  {
    id: 'c',
    label: 'C',
    judge0Id: 50,
    color: 'bg-cyan-400',
    template: `#include <stdio.h>
#include <stdlib.h>

int main() {

    // Write your C code here
    
    return 0;
}`,
  },
  {
    id: 'java',
    label: 'Java',
    judge0Id: 62,
    color: 'bg-orange-400',
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your Java code here

        System.out.println("Hello, World!");
    }
}`,
  },
  {
    id: 'python',
    label: 'Python',
    judge0Id: 71,
    color: 'bg-green-400',
    template: `# Write your Python code here

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
  },
];

async function runWithJudge0(
  languageId: number,
  code: string,
  stdin: string
): Promise<{ output: string; error: string; compileError: string; time: string | null; memory: number | null }> {
  const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: languageId,
      source_code: code,
      stdin: stdin || '',
    }),
  });

  if (!res.ok) {
    throw new Error(`Judge0 responded with HTTP ${res.status}`);
  }

  const data = await res.json();

  const statusId: number = data.status?.id ?? 0;
  let statusError = '';
  if (statusId === 5) {
    statusError = 'Time Limit Exceeded';
  } else if (statusId === 6) {
    statusError = 'Compilation Error';
  } else if (statusId >= 7 && statusId <= 12) {
    statusError = `Runtime Error (${data.status?.description ?? statusId})`;
  } else if (statusId !== 3 && statusId !== 0) {
    statusError = `Execution failed: ${data.status?.description ?? `status ${statusId}`}`;
  }

  const stderr = (data.stderr || '').trim();

  return {
    output: (data.stdout || '').trim(),
    error: statusError && stderr ? `${statusError}\n\n${stderr}` : statusError || stderr,
    compileError: (data.compile_output || '').trim(),
    time: data.time || null,
    memory: data.memory || null,
  };
}

interface CodeRunnerProps {
  defaultCode?: string;
  defaultLang?: 'c' | 'cpp' | 'java' | 'python';
}

export function CodeRunner({ defaultCode, defaultLang = 'cpp' }: CodeRunnerProps) {
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[0]
  );
  const [code, setCode] = useState(
    defaultCode || (LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[0]).template
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [compileError, setCompileError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [serverMemory, setServerMemory] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleLangChange = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setCode(defaultCode || lang.template);
    setOutput(''); setError(''); setCompileError(''); setRuntime(null); setServerTime(null); setServerMemory(null);
    setShowLangMenu(false);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(''); setError(''); setCompileError(''); setRuntime(null); setServerTime(null); setServerMemory(null);
    const startTime = Date.now();

    try {
      const result = await runWithJudge0(
        selectedLang.judge0Id,
        code,
        input,
      );
      setRuntime(Date.now() - startTime);
      setOutput(result.output);
      setError(result.error);
      setCompileError(result.compileError);
      setServerTime(result.time);
      setServerMemory(result.memory);
    } catch (err: any) {
      setRuntime(Date.now() - startTime);
      setError(
        `Could not reach the compiler (Judge0).\n\nThis may be a temporary outage. Please try again in a moment.\n\nDetails: ${err?.message || String(err)}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(defaultCode || selectedLang.template);
    setOutput(''); setError(''); setCompileError(''); setRuntime(null); setServerTime(null); setServerMemory(null);
  };

  const hasResult = output || error || compileError || isRunning;
  const hasError = error || compileError;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-zinc-950 mt-8">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-zinc-300">Code Playground</span>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', selectedLang.color)} />
              {selectedLang.label}
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[90px]">
                  {LANGUAGES.map(lang => (
                    <button key={lang.id} onClick={() => handleLangChange(lang)}
                      className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                        selectedLang.id === lang.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-700')}>
                      <span className={cn('w-2 h-2 rounded-full', lang.color)} />
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 hidden sm:block">Ctrl+Enter to run</span>
          <button onClick={handleCopy} title="Copy code"
            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleReset} title="Reset to template"
            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRun} disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium transition-colors">
            {isRunning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running…</>
              : <><Play className="w-3.5 h-3.5" />Run</>}
          </button>
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="relative flex" style={{ minHeight: '260px', maxHeight: '460px' }}>
        {/* Line numbers */}
        <div ref={lineNumbersRef}
          className="flex-shrink-0 w-10 bg-zinc-950 border-r border-white/5 overflow-hidden select-none"
          style={{ overflowY: 'hidden' }}>
          <div className="py-3 px-1 text-right">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="text-zinc-600 leading-6"
                style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          className="flex-1 bg-zinc-950 text-zinc-100 resize-none focus:outline-none py-3 px-4 leading-6 font-mono overflow-auto"
          style={{ fontSize: '13px', tabSize: 4 }}
          placeholder="Write your code here…"
        />
      </div>

      {/* ── stdin ── */}
      <div className="border-t border-white/10 bg-zinc-900">
        <button onClick={() => setShowInput(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left">
          <ChevronDown className={cn('w-3 h-3 transition-transform', showInput && 'rotate-180')} />
          stdin / custom input
        </button>
        {showInput && (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter input for your program here…"
            rows={3}
            className="w-full bg-zinc-950 text-zinc-300 font-mono text-xs px-4 py-2 resize-none focus:outline-none border-t border-white/10"
          />
        )}
      </div>

      {/* ── Output ── */}
      {hasResult && (
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10">
            <div className="flex items-center gap-2">
              {isRunning
                ? <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                : hasError
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              }
              <span className="text-xs font-medium text-zinc-300">
                {isRunning ? 'Compiling & running…' : hasError ? 'Error' : 'Output'}
              </span>
              {runtime !== null && !isRunning && (
                <span className="text-xs text-zinc-600">{runtime}ms</span>
              )}
              {serverTime !== null && !isRunning && (
                <span className="text-xs text-zinc-600">· {serverTime}s CPU</span>
              )}
              {serverMemory !== null && !isRunning && (
                <span className="text-xs text-zinc-600">· {serverMemory} KB</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 px-4 py-3 overflow-auto" style={{ maxHeight: '220px' }}>
            {isRunning && !output && !hasError ? (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling and running…
              </div>
            ) : (
              <>
                {compileError && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1 font-semibold">Compile error:</p>
                    <pre className="text-red-400 font-mono text-xs leading-6 whitespace-pre-wrap">{compileError}</pre>
                  </div>
                )}
                {output && (
                  <pre className="text-green-400 font-mono text-xs leading-6 whitespace-pre-wrap">{output}</pre>
                )}
                {error && !compileError && (
                  <pre className="text-red-400 font-mono text-xs leading-6 whitespace-pre-wrap">{error}</pre>
                )}
                {!output && !hasError && !isRunning && (
                  <span className="text-zinc-600 text-xs">(no output)</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-zinc-600">
          Powered by{' '}
          <a href="https://judge0.com" target="_blank" rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Judge0 CE
          </a>
        </span>
        <span className="text-xs text-zinc-600">
          {lineCount} lines · {code.length} chars
        </span>
      </div>
    </div>
  );
}
