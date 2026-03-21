'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Copy, Check, ChevronDown, Loader2, Terminal, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  {
    id: 'c',
    label: 'C',
    pistonLang: 'c',
    version: '10.2.0',
    extension: 'c',
    template: `#include <stdio.h>

int main() {
    printf("Hello, DSA Suite!\\n");
    
    // Write your C code here
    int arr[] = {5, 3, 8, 1, 9, 2};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    // Bubble sort
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    
    printf("Sorted: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`,
  },
  {
    id: 'cpp',
    label: 'C++',
    pistonLang: 'c++',
    version: '10.2.0',
    extension: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cout << "Hello, DSA Suite!" << endl;
    
    // Write your C++ code here
    vector<int> arr = {5, 3, 8, 1, 9, 2};
    
    sort(arr.begin(), arr.end());
    
    cout << "Sorted: ";
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
    
    return 0;
}`,
  },
];

interface CodeRunnerProps {
  defaultCode?: string;
  defaultLang?: 'c' | 'cpp';
}

export function CodeRunner({ defaultCode, defaultLang = 'cpp' }: CodeRunnerProps) {
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find(l => l.id === defaultLang) || LANGUAGES[1]
  );
  const [code, setCode] = useState(defaultCode || selectedLang.template);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleLangChange = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setCode(defaultCode || lang.template);
    setOutput('');
    setError('');
    setRuntime(null);
    setShowLangMenu(false);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('');
    setError('');
    setRuntime(null);

    const startTime = Date.now();

    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang.pistonLang,
          version: selectedLang.version,
          files: [{ name: `main.${selectedLang.extension}`, content: code }],
          stdin: input,
          run_timeout: 5000,
          compile_timeout: 10000,
        }),
      });

      const elapsed = Date.now() - startTime;
      const data = await res.json();

      setRuntime(elapsed);

      if (data.compile && data.compile.stderr) {
        setError(data.compile.stderr);
        setOutput('');
      } else if (data.run) {
        if (data.run.stderr && data.run.stderr.trim()) {
          setError(data.run.stderr);
        }
        if (data.run.stdout) {
          setOutput(data.run.stdout);
        } else if (!data.run.stderr) {
          setOutput('(no output)');
        }
      }
    } catch (err) {
      setError('Failed to connect to compiler. Check your internet connection.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter / Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }
    // Tab indentation
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
    setOutput('');
    setError('');
    setRuntime(null);
  };

  const hasOutput = output || error;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-zinc-950 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-zinc-300">Code Playground</span>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <span className={cn(
                'w-2 h-2 rounded-full',
                selectedLang.id === 'cpp' ? 'bg-blue-400' : 'bg-yellow-400'
              )} />
              {selectedLang.label}
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[100px]">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => handleLangChange(lang)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                        selectedLang.id === lang.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-700'
                      )}
                    >
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
          <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium transition-colors"
          >
            {isRunning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
              : <><Play className="w-3.5 h-3.5" /> Run</>
            }
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex" style={{ minHeight: '280px', maxHeight: '480px' }}>
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-10 bg-zinc-950 border-r border-white/5 overflow-hidden select-none"
          style={{ overflowY: 'hidden' }}
        >
          <div className="py-3 px-2 text-right">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="text-zinc-600 leading-6" style={{ fontSize: '13px', fontFamily: 'monospace' }}>
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
          placeholder="Write your code here..."
        />
      </div>

      {/* Stdin toggle */}
      <div className="border-t border-white/10 bg-zinc-900">
        <button
          onClick={() => setShowInput(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left"
        >
          <ChevronDown className={cn('w-3 h-3 transition-transform', showInput && 'rotate-180')} />
          stdin / custom input
        </button>
        {showInput && (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter input for your program here..."
            rows={3}
            className="w-full bg-zinc-950 text-zinc-300 font-mono text-xs px-4 py-2 resize-none focus:outline-none border-t border-white/10"
          />
        )}
      </div>

      {/* Output panel */}
      {(hasOutput || isRunning) && (
        <div className="border-t border-white/10">
          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10">
            <div className="flex items-center gap-2">
              {error
                ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                : <Check className="w-3.5 h-3.5 text-green-400" />
              }
              <span className="text-xs font-medium text-zinc-300">
                {error ? 'Error' : 'Output'}
              </span>
              {runtime !== null && (
                <span className="text-xs text-zinc-600">{runtime}ms</span>
              )}
            </div>
          </div>

          {/* Output content */}
          <div className="bg-zinc-950 px-4 py-3 overflow-auto" style={{ maxHeight: '240px' }}>
            {isRunning && !hasOutput ? (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling and running…
              </div>
            ) : (
              <>
                {output && (
                  <pre className="text-green-400 font-mono text-xs leading-6 whitespace-pre-wrap">{output}</pre>
                )}
                {error && (
                  <pre className="text-red-400 font-mono text-xs leading-6 whitespace-pre-wrap">{error}</pre>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-zinc-600">
          Powered by <span className="text-zinc-500">Piston API</span> · GCC {selectedLang.version}
        </span>
        <span className="text-xs text-zinc-600">
          {code.split('\n').length} lines · {code.length} chars
        </span>
      </div>
    </div>
  );
}
