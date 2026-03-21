'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play, RotateCcw, Copy, Check, ChevronDown,
  Loader2, Terminal, AlertCircle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Preferred compilers in order — first match found in Wandbox list wins
const LANG_PREFERENCES: Record<string, string[]> = {
  cpp: ['gcc-head', 'gcc-13.2.0', 'gcc-12.3.0'],
  c:   ['gcc-head-c', 'gcc-13.2.0-c', 'gcc-12.3.0-c'],
  java: ['openjdk-jdk-21+35', 'openjdk-jdk-22+36', 'openjdk-jdk-17+35', 'openjdk-jdk21.0.2+13'],
  python: ['cpython-3.12.0', 'cpython-3.11.0', 'cpython-3.10.0', 'cpython-head'],
};

const LANG_CONFIG = [
  {
    id: 'cpp',
    label: 'C++',
    color: 'bg-blue-400',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your C++ code here
    vector<int> arr = {5, 3, 8, 1, 9, 2};
    sort(arr.begin(), arr.end());

    cout << "Sorted: ";
    for (int x : arr) cout << x << " ";
    cout << endl;

    return 0;
}`,
  },
  {
    id: 'c',
    label: 'C',
    color: 'bg-yellow-400',
    template: `#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    int arr[] = {5, 3, 8, 1, 9, 2};
    int n = sizeof(arr) / sizeof(arr[0]);
    qsort(arr, n, sizeof(int), cmp);
    printf("Sorted: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}`,
  },
  {
    id: 'java',
    label: 'Java',
    color: 'bg-orange-400',
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your Java code here
        int[] arr = {5, 3, 8, 1, 9, 2};
        Integer[] boxed = new Integer[arr.length];
        for (int i = 0; i < arr.length; i++) boxed[i] = arr[i];
        Arrays.sort(boxed);
        System.out.print("Sorted: ");
        for (int x : boxed) System.out.print(x + " ");
        System.out.println();
    }
}`,
  },
  {
    id: 'python',
    label: 'Python',
    color: 'bg-green-400',
    template: `# Write your Python code here
arr = [5, 3, 8, 1, 9, 2]
arr.sort()
print("Sorted:", *arr)
`,
  },
];

interface CodeRunnerProps {
  defaultCode?: string;
  defaultLang?: 'c' | 'cpp' | 'java' | 'python';
}

export function CodeRunner({ defaultCode, defaultLang = 'cpp' }: CodeRunnerProps) {
  const initLang = LANG_CONFIG.find(l => l.id === defaultLang) || LANG_CONFIG[0];
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
  // Map of langId -> resolved wandbox compiler name
  const [resolvedCompilers, setResolvedCompilers] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Resolve compiler names from Wandbox list on mount
  useEffect(() => {
    fetch('https://wandbox.org/api/list.json')
      .then(r => r.json())
      .then((list: Array<{ name: string; language: string }>) => {
        const names = new Set(list.map((c) => c.name));
        const resolved: Record<string, string> = {};
        for (const [langId, prefs] of Object.entries(LANG_PREFERENCES)) {
          const found = prefs.find(p => names.has(p));
          if (found) resolved[langId] = found;
        }
        setResolvedCompilers(resolved);
      })
      .catch(() => {
        // If list fetch fails, fall back to first preference
        const fallback: Record<string, string> = {};
        for (const [langId, prefs] of Object.entries(LANG_PREFERENCES)) {
          fallback[langId] = prefs[0];
        }
        setResolvedCompilers(fallback);
      });
  }, []);

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

  const handleLangChange = (lang: typeof LANG_CONFIG[0]) => {
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

    const compiler = resolvedCompilers[selectedLang.id] || LANG_PREFERENCES[selectedLang.id][0];
    const isClike = selectedLang.id === 'c' || selectedLang.id === 'cpp';

    try {
      const body: Record<string, string> = { compiler, code };
      if (isClike) body['options'] = 'warning';
      if (input.trim()) body['stdin'] = input;

      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setRuntime(Date.now() - startTime);

      if (!res.ok) {
        setError('Compiler request failed (HTTP ' + res.status + '). Compiler used: ' + compiler + '. Please try again.');
        return;
      }

      const data = await res.json();
      setOutput((data.program_output || '').trim());
      setError((data.program_error || '').trim());
      setCompileError((data.compiler_error || '').trim());
    } catch (err: any) {
      setRuntime(Date.now() - startTime);
      setError('Could not reach Wandbox.\nPlease check your internet connection.\n\nDetails: ' + (err?.message || String(err)));
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
    clearState();
  };

  const hasResult = output || error || compileError || isRunning;
  const hasError = error || compileError;
  const resolvedName = resolvedCompilers[selectedLang.id];

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
                  {LANG_CONFIG.map(lang => (
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

          {/* Show resolved compiler name */}
          {resolvedName && (
            <span className="text-xs text-zinc-600 hidden sm:block">{resolvedName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 hidden md:block">Ctrl+Enter to run</span>
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
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-white/10">
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
        </span>
        <span className="text-xs text-zinc-600">{lineCount} lines · {code.length} chars</span>
      </div>
    </div>
  );
}
