'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getProblemBySlug,
  submitCode,
  getMySubmissions,
  getSubmissionById,
  type Submission,
  type Verdict,
} from '@/lib/problems';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Code2,
  ListChecks,
  Eye,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

const DIFF_STYLES: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const VERDICT_STYLES: Record<Verdict, string> = {
  ACCEPTED: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  WRONG_ANSWER: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  TIME_LIMIT_EXCEEDED: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  RUNTIME_ERROR: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  COMPILATION_ERROR: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  PENDING: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

const VERDICT_LABELS: Record<Verdict, string> = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  PENDING: 'Pending',
};

const LANGUAGES = [
  {
    id: 'cpp',
    label: 'C++',
    judge0Id: 54,
    template: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  },
  {
    id: 'c',
    label: 'C',
    judge0Id: 50,
    template: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  },
  {
    id: 'java',
    label: 'Java',
    judge0Id: 62,
    template: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your code here\n    }\n}`,
  },
  {
    id: 'python',
    label: 'Python',
    judge0Id: 71,
    template: `# Write your code here\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
  },
];

async function runWithJudge0(
  languageId: number,
  code: string,
  stdin: string,
): Promise<{ output: string; error: string; compileError: string; time: string | null; memory: number | null }> {
  const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: languageId, source_code: code, stdin: stdin || '' }),
  });
  if (!res.ok) throw new Error(`Judge0 responded with HTTP ${res.status}`);
  const data = await res.json();
  const statusId: number = data.status?.id ?? 0;
  let statusError = '';
  if (statusId === 5) statusError = 'Time Limit Exceeded';
  else if (statusId === 6) statusError = 'Compilation Error';
  else if (statusId >= 7 && statusId <= 12) statusError = `Runtime Error (${data.status?.description ?? statusId})`;
  else if (statusId !== 3 && statusId !== 0) statusError = `Execution failed: ${data.status?.description ?? `status ${statusId}`}`;
  const stderr = (data.stderr || '').trim();
  return {
    output: (data.stdout || '').trim(),
    error: statusError && stderr ? `${statusError}\n\n${stderr}` : statusError || stderr,
    compileError: (data.compile_output || '').trim(),
    time: data.time || null,
    memory: data.memory || null,
  };
}

// ── Submission detail modal ───────────────────────────────────────────────────

function SubmissionDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmissionById(id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-xl border border-border shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Submission Detail</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', VERDICT_STYLES[data.verdict])}>
                {VERDICT_LABELS[data.verdict]}
              </span>
              <span className="text-muted-foreground">{data.language.toUpperCase()}</span>
              <span className="text-muted-foreground">
                {data.testCasesPassed}/{data.testCasesTotal} test cases
              </span>
              {data.runtime && <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{data.runtime}s</span>}
            </div>
            {data.errorOutput && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3">
                <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">{data.errorOutput}</pre>
              </div>
            )}
            {data.code && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Code</p>
                <div className="rounded-lg bg-zinc-950 border border-border overflow-auto max-h-64">
                  <pre className="p-4 text-xs text-zinc-200 font-mono whitespace-pre">{data.code}</pre>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();

  // Editor state
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  // Run state
  const [runOutput, setRunOutput] = useState('');
  const [runError, setRunError] = useState('');
  const [runCompileError, setRunCompileError] = useState('');
  const [runTime, setRunTime] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Submit state
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);

  // Submission detail
  const [viewSubmissionId, setViewSubmissionId] = useState<string | null>(null);

  // Hints
  const [showHints, setShowHints] = useState(false);

  // Copy
  const [copied, setCopied] = useState(false);

  // Line numbers
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lineCount = code.split('\n').length;

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const { data: problem, isLoading: problemLoading } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => getProblemBySlug(slug),
    staleTime: 5 * 60_000,
  });

  const { data: submissions = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ['my-submissions', slug],
    queryFn: () => getMySubmissions(slug),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitCode({ problemId: problem!.id, language: selectedLang.id, code }),
    onSuccess: (result) => {
      setLastSubmission(result);
      refetchSubmissions();
      if (result.verdict === 'ACCEPTED') {
        toast.success('Accepted! All test cases passed 🎉');
      } else {
        toast.error(VERDICT_LABELS[result.verdict]);
      }
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  });

  const handleLangChange = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setCode(lang.template);
    setShowLangMenu(false);
    setRunOutput('');
    setRunError('');
    setRunCompileError('');
    setRunTime(null);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunOutput('');
    setRunError('');
    setRunCompileError('');
    setRunTime(null);
    try {
      const result = await runWithJudge0(selectedLang.judge0Id, code, stdin);
      setRunOutput(result.output);
      setRunError(result.error);
      setRunCompileError(result.compileError);
      setRunTime(result.time);
    } catch (err: any) {
      setRunError(`Could not reach the compiler. Please try again.\n\n${err?.message ?? ''}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (problemLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Problem not found</h2>
        <Link href="/problems" className="text-indigo-600 hover:underline text-sm">
          ← Back to problems
        </Link>
      </div>
    );
  }

  const sampleTestCases = problem.testCases?.filter(tc => !tc.isHidden) ?? [];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <Link href="/problems" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Problems
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{problem.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left Panel: Problem Description ── */}
        <div className="w-full lg:w-[45%] space-y-5">
          {/* Title + badges */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-xl font-bold flex-1">{problem.title}</h1>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0', DIFF_STYLES[problem.difficulty])}>
                {problem.difficulty[0] + problem.difficulty.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{problem.topic.subject.name} › {problem.topic.title}</span>
              <span>·</span>
              <span>{problem._count.submissions} submissions</span>
              {problem.timeLimit && <><span>·</span><span>Time: {problem.timeLimit}s</span></>}
              {problem.memoryLimit && <><span>·</span><span>Memory: {problem.memoryLimit}MB</span></>}
            </div>
          </div>

          {/* Description */}
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:p-0 prose-pre:bg-transparent text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeKatex]}
            >
              {problem.description}
            </ReactMarkdown>
          </article>

          {/* Constraints */}
          {problem.constraints && (
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Constraints</h3>
              <div className="rounded-lg bg-muted p-3 text-sm font-mono whitespace-pre-wrap">
                {problem.constraints}
              </div>
            </div>
          )}

          {/* Sample test cases */}
          {sampleTestCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Examples</h3>
              {sampleTestCases.map((tc, i) => (
                <div key={tc.id} className="rounded-lg border border-border overflow-hidden text-sm">
                  <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
                    Example {i + 1}
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Input</span>
                      <pre className="mt-1 rounded bg-zinc-950 text-zinc-200 p-2 text-xs font-mono overflow-x-auto">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Expected Output</span>
                      <pre className="mt-1 rounded bg-zinc-950 text-zinc-200 p-2 text-xs font-mono overflow-x-auto">{tc.expected}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hints */}
          {problem.hints.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setShowHints(h => !h)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span>Hints ({problem.hints.length})</span>
                {showHints ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showHints && (
                <div className="px-4 pb-3 space-y-2 border-t border-border">
                  {problem.hints.map((hint, i) => (
                    <div key={i} className="flex gap-2 text-sm pt-2">
                      <span className="text-indigo-600 font-semibold shrink-0">#{i + 1}</span>
                      <span className="text-muted-foreground">{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Panel: Editor + Submissions ── */}
        <div className="w-full lg:flex-1 space-y-5">
          {/* Editor card */}
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/10">
              {/* Language picker */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(m => !m)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  {selectedLang.label}
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-lg py-1 min-w-[100px] shadow-xl">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => handleLangChange(lang)}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 transition-colors',
                            lang.id === selectedLang.id ? 'text-indigo-400 font-medium' : 'text-zinc-300',
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setCode(selectedLang.template)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Reset to template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="relative bg-zinc-950 flex" style={{ minHeight: '320px', maxHeight: '480px' }}>
              {/* Line numbers */}
              <div
                ref={lineNumbersRef}
                className="select-none text-right pr-3 pl-2 py-4 text-zinc-600 font-mono text-xs leading-6 overflow-hidden flex-shrink-0"
                style={{ minWidth: '2.5rem' }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i + 1}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-zinc-200 font-mono text-xs leading-6 py-4 pr-4 resize-none outline-none overflow-auto"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>

            {/* stdin */}
            <div className="border-t border-zinc-800">
              <button
                onClick={() => setShowStdin(s => !s)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Custom input (stdin)</span>
                {showStdin ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {showStdin && (
                <textarea
                  value={stdin}
                  onChange={e => setStdin(e.target.value)}
                  placeholder="Enter custom input..."
                  className="w-full bg-zinc-900 text-zinc-200 text-xs font-mono p-3 h-20 resize-none outline-none border-t border-zinc-800"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-t border-white/10">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                  {submitMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Login to submit
                </a>
              )}

              <span className="ml-auto text-xs text-zinc-500">Ctrl+Enter to run</span>
            </div>
          </div>

          {/* Run output */}
          {(runOutput || runError || runCompileError) && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-white/10">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">Output</span>
                {runTime && <span className="ml-auto text-xs text-zinc-500">{runTime}s</span>}
              </div>
              <div className="bg-zinc-950 p-4">
                {runCompileError && (
                  <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap mb-2">{runCompileError}</pre>
                )}
                {runError && (
                  <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap mb-2">{runError}</pre>
                )}
                {runOutput && (
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{runOutput}</pre>
                )}
              </div>
            </div>
          )}

          {/* Submission result */}
          {lastSubmission && (
            <div className={cn(
              'rounded-xl border p-4 space-y-2',
              lastSubmission.verdict === 'ACCEPTED'
                ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10',
            )}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {lastSubmission.verdict === 'ACCEPTED'
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span className={cn('font-semibold text-sm', VERDICT_STYLES[lastSubmission.verdict])}>
                    {VERDICT_LABELS[lastSubmission.verdict]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    {lastSubmission.testCasesPassed}/{lastSubmission.testCasesTotal} tests passed
                  </span>
                  {lastSubmission.runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{lastSubmission.runtime}s
                    </span>
                  )}
                </div>
              </div>
              {lastSubmission.errorOutput && (
                <pre className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap bg-red-100 dark:bg-red-950/30 rounded p-2">
                  {lastSubmission.errorOutput}
                </pre>
              )}
            </div>
          )}

          {/* Submissions history */}
          {isAuthenticated && submissions.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <Code2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">My Submissions</h3>
              </div>
              <div className="divide-y divide-border">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
                    onClick={() => setViewSubmissionId(sub.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', VERDICT_STYLES[sub.verdict])}>
                        {VERDICT_LABELS[sub.verdict]}
                      </span>
                      <span className="text-xs text-muted-foreground">{sub.language.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {sub.runtime && <span>{sub.runtime}s</span>}
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission detail modal */}
      {viewSubmissionId && (
        <SubmissionDetail id={viewSubmissionId} onClose={() => setViewSubmissionId(null)} />
      )}
    </div>
  );
}
