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
    color: 'bg-blue-400',
    wandboxCompiler: 'gcc-head',
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
    color: 'bg-yellow-400',
    wandboxCompiler: 'gcc-head-c',
    template: `#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    // Write your C code here
    
    return 0;
}`,
  },
  {
    id: 'java',
    label: 'Java',
    color: 'bg-orange-400',
    wandboxCompiler: 'openjdk-head',
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your Java code here

    }
}`,
  },
  {
    id: 'python',
    label: 'Python',
    color: 'bg-green-400',
    wandboxCompiler: 'cpython-head',
    template: `# Write your Python code here,
  },
];

async function runWithWandbox(
  compiler: string,
  code: string,
  stdin: string
): Promise<{ output: string; error: string; compileError: string }> {
  const body: Record<string, string> = {
    compiler,
    code,
    options: 'warning',
  };
  if (stdin.trim()) body.stdin = stdin;

  const res = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Wandbox HTTP ${res.status}`);

  const data = await res.json();
  return {
    output: (data.program_output || '').trim(),
    error: (data.program_error || '').trim(),
    compileError: (data.compiler_error || '').trim(),
  };
}

interface CodeRunnerProps {
  defaultCode?: string;
  defaultLang?: 'c' | 'cpp' | 'java' | 'python';
}

export function CodeRunner({ defaultCode, defaultLang = 'cpp' }: CodeRunnerProps) {
  const initLang = LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[0];
  const [selectedLang, setSelectedLang] = useState(initLang);
  const [code, setCode] = useState(defaultCode || initLang.template);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [compileError, setCompileError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);
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

  const clearState = () => {
    setOutput(''); setError(''); setCompileError(''); setRuntime(null);
  };

  const handleLangChange = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setCode(defaultCode || lang.template);
    clearState();
    setShowLangMenu(false);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    clearState();
    const startTime = Date.now();
    try {
      const result = await runWithWandbox(selectedLang.wandboxCompiler, code, input);
      setRuntime(Date.now() - startTime);
      setOutput(result.output);
      setError(result.error);
      setCompileError(result.compileError);
    } catch (err: any) {
      setRuntime(Date.now() - startTime);
      setError(`Could not reach Wandbox compiler.\nPlease try again in a moment.\n\nDetails: ${err?.message || String(err)}`);
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
      const indent = selectedLang.id === 'python' ? '    ' : '    ';
      const newCode = code.substring(0, start) + indent + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + indent.length;
          textareaRef.current.selectionEnd = start + indent.length;
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
    clearState();
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
                <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[110px]">
                  {LANGUAGES.map(lang => (
                    <button key={lang.id} onClick={() => handleLangChange(lang)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                        selectedLang.id === lang.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-700'
                      )}>
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', lang.color)} />
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
                  <div className="mb-2">
                    <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Compile error</p>
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
          <a href="https://wandbox.org" target="_blank" rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Wandbox
          </a>
          {' '}· GCC / OpenJDK / CPython (latest)
        </span>
        <span className="text-xs text-zinc-600">
          {lineCount} lines · {code.length} chars
        </span>
      </div>
    </div>
  );
}
