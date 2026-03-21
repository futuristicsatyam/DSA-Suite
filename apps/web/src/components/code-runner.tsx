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
    pistonLang: 'c++',
    pistonVersion: '*',
    extension: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your C++ code here
    return 0;
}`,
  },
  {
    id: 'c',
    label: 'C',
    judge0Id: 50,
    pistonLang: 'c',
    pistonVersion: '*',
    extension: 'c',
    template: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your C code here
    

    return 0;
}`,
  },
];

// Try Judge0 CE first (reliable, no key), then Piston as fallback
async function runWithJudge0(langId: number, code: string, stdin: string) {
  const res = await fetch(
    'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: langId,
        source_code: code,
        stdin: stdin,
      }),
    }
  );
  if (!res.ok) throw new Error(`Judge0 HTTP ${res.status}`);
  const data = await res.json();
  // Judge0 statuses: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compile Error
  const stdout = data.stdout || '';
  const stderr = data.stderr || '';
  const compileErr = data.compile_output || '';
  const status = data.status?.description || '';

  if (compileErr && compileErr.trim()) return { output: stdout, error: compileErr };
  if (status === 'Time Limit Exceeded') return { output: '', error: 'Time limit exceeded (5s)' };
  if (status === 'Runtime Error (NZEC)') return { output: stdout, error: stderr || 'Runtime error' };
  return { output: stdout, error: stderr };
}

async function runWithPiston(lang: string, version: string, ext: string, code: string, stdin: string) {
  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: lang,
      version: version,
      files: [{ name: `main.${ext}`, content: code }],
      stdin: stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
    }),
  });
  if (!res.ok) throw new Error(`Piston HTTP ${res.status}`);
  const data = await res.json();
  const compileErr = data.compile?.stderr || '';
  const stdout = data.run?.stdout || '';
  const stderr = data.run?.stderr || '';
  if (compileErr.trim()) return { output: stdout, error: compileErr };
  return { output: stdout, error: stderr };
}

interface CodeRunnerProps {
  defaultCode?: string;
  defaultLang?: 'c' | 'cpp';
}

export function CodeRunner({ defaultCode, defaultLang = 'cpp' }: CodeRunnerProps) {
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[0]
  );
  const [code, setCode] = useState(defaultCode || (LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[0]).template);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [apiUsed, setApiUsed] = useState('');
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
    setOutput(''); setError(''); setRuntime(null); setApiUsed('');
    setShowLangMenu(false);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(''); setError(''); setRuntime(null); setApiUsed('');
    const startTime = Date.now();

    try {
      // Try Judge0 first
      try {
        const result = await runWithJudge0(selectedLang.judge0Id, code, input);
        setRuntime(Date.now() - startTime);
        setOutput(result.output);
        setError(result.error);
        setApiUsed('Judge0 CE');
        return;
      } catch (e) {
        console.warn('Judge0 failed, trying Piston:', e);
      }

      // Fallback to Piston
      const result = await runWithPiston(
        selectedLang.pistonLang,
        selectedLang.pistonVersion,
        selectedLang.extension,
        code,
        input,
      );
      setRuntime(Date.now() - startTime);
      setOutput(result.output);
      setError(result.error);
      setApiUsed('Piston');
    } catch (err: any) {
      setError(`Failed to reach compiler API.\n\nMake sure you are connected to the internet.\n\nDetails: ${err?.message || err}`);
      setRuntime(Date.now() - startTime);
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
    setOutput(''); setError(''); setRuntime(null); setApiUsed('');
  };

  const hasResult = output || error || isRunning;

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
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                selectedLang.id === 'cpp' ? 'bg-blue-400' : 'bg-yellow-400'
              )} />
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
                      <span className={cn('w-2 h-2 rounded-full', lang.id === 'cpp' ? 'bg-blue-400' : 'bg-yellow-400')} />
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

        {/* Code area */}
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
                : error
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              }
              <span className="text-xs font-medium text-zinc-300">
                {isRunning ? 'Running…' : error ? 'Error' : 'Output'}
              </span>
              {runtime !== null && !isRunning && (
                <span className="text-xs text-zinc-600">{runtime}ms</span>
              )}
              {apiUsed && !isRunning && (
                <span className="text-xs text-zinc-700">via {apiUsed}</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 px-4 py-3 overflow-auto" style={{ maxHeight: '220px' }}>
            {isRunning && !output && !error ? (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling and running…
              </div>
            ) : (
              <>
                {output && output.trim() && (
                  <pre className="text-green-400 font-mono text-xs leading-6 whitespace-pre-wrap">{output}</pre>
                )}
                {error && error.trim() && (
                  <pre className="text-red-400 font-mono text-xs leading-6 whitespace-pre-wrap">{error}</pre>
                )}
                {!output && !error && !isRunning && (
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
          Powered by Judge0 CE &amp; Piston · GCC 10
        </span>
        <span className="text-xs text-zinc-600">
          {lineCount} lines · {code.length} chars
        </span>
      </div>
    </div>
  );
}
