"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Send, Play, RefreshCcw, CheckCircle2, Trophy, Star } from "../icons";
import { apiFetch } from "../../../../apps/web/lib/api";

import { DescriptionPanel } from "./DescriptionPanel";
import { EditorPanel } from "./EditorPanel";
import { ConsolePanel } from "./ConsolePanel";

const FALLBACK_CODE = "# No code available for this language.";

interface ProblemData {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  defaultCode: Record<string, string>;
  testCases: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  isSolved?: boolean;
}

interface ProblemInterfaceProps {
  problem: ProblemData;
  user?: {
    name: string;
    avatar: string;
    streak: number;
  };
  onSuccess?: (newStreak: number) => void;
}

export const ProblemInterface: React.FC<ProblemInterfaceProps> = ({ problem, user, onSuccess }) => {
  const router = useRouter();
  const availableLanguages = Object.keys(problem.defaultCode);
  const defaultLanguage = availableLanguages[0] || "python";

  const [language, setLanguage] = useState(defaultLanguage);
  const [code, setCode] = useState(problem.defaultCode[defaultLanguage] ?? FALLBACK_CODE);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [output, setOutput] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(user?.streak || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadySolved, setIsAlreadySolved] = useState(false);
  const submissionAbort = useRef<AbortController | null>(null);
  const [hasSolved, setHasSolved] = useState(Boolean(problem.isSolved));
  const streakUpdatedRef = useRef(false); // Track if streak was updated via submission

  // Resizing logic
  const [leftWidth, setLeftWidth] = useState(480);
  const [consoleHeight, setConsoleHeight] = useState(320);
  const isResizingWidth = useRef(false);
  const isResizingHeight = useRef(false);

  const startResizingWidth = useCallback(() => {
    isResizingWidth.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const startResizingHeight = useCallback(() => {
    isResizingHeight.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizingWidth.current = false;
    isResizingHeight.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingWidth.current) {
      const newWidth = e.clientX;
      if (newWidth > 300 && newWidth < Math.min(window.innerWidth - 400, 900)) {
        setLeftWidth(newWidth);
      }
    } else if (isResizingHeight.current) {
      const container = document.getElementById('right-panel');
      if (container) {
        const rect = container.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY - 64; // Substracting toolbar height
        if (newHeight > 100 && newHeight < window.innerHeight - 200) {
          setConsoleHeight(newHeight);
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    if (user?.streak !== undefined && !streakUpdatedRef.current) {
      setCurrentStreak(user.streak);
    }
  }, [user?.streak]);

  // Fetch fresh streak data from API on mount only
  useEffect(() => {
    const fetchStreakData = async () => {
      if (!user || streakUpdatedRef.current) return;
      try {
        const userData = await apiFetch("/user/dashboard");
        if (userData?.user?.streakDays !== undefined) {
          setCurrentStreak(userData.user.streakDays);
        }
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
        // Fallback to prop value if API fails
        if (user?.streak !== undefined) {
          setCurrentStreak(user.streak);
        }
      }
    };
    fetchStreakData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    const nextLanguage = Object.keys(problem.defaultCode)[0] || "python";
    setLanguage(nextLanguage);
    setCode(problem.defaultCode[nextLanguage] ?? FALLBACK_CODE);
    setOutput(null);
    setResetKey((prev) => prev + 1);
  }, [problem.id, problem.defaultCode]);

  useEffect(() => {
    setHasSolved(Boolean(problem.isSolved));
    setIsSubmitting(false);
    return () => { submissionAbort.current?.abort(); };
  }, [problem.id, problem.isSolved]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(problem.defaultCode[newLang] ?? FALLBACK_CODE);
  };

  const handleReset = () => {
    setCode(problem.defaultCode[language] ?? FALLBACK_CODE);
    setResetKey(prev => prev + 1);
  };

  const runCode = async () => {
    try {
      setIsRunning(true);
      setOutput([{ testcase: 0, status: 'Running', stdout: "Running..." }]);

      const data = await apiFetch("/runCode", {
        method: "POST",
        body: JSON.stringify({
          problemSlug: problem.slug,
          language,
          code,
        }),
      });

      if (data.results) {
        setOutput(data.results);
        return data.results;
      } else if (data.message) {
        const errResult = [{ testcase: 0, status: 'Error', stderr: data.message }];
        setOutput(errResult);
        return errResult;
      }
    } catch (err) {
      const errResult = [{ testcase: 0, status: 'Error', stderr: "Execution Error" }];
      setOutput(errResult);
      return errResult;
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    submissionAbort.current?.abort();
    const controller = new AbortController();
    submissionAbort.current = controller;
    const labels: Record<string, string> = {
      ACCEPTED: "Accepted", WRONG_ANSWER: "Wrong Answer", TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
      COMPILATION_ERROR: "Compilation Error", RUNTIME_ERROR: "Runtime Error", INTERNAL_ERROR: "Execution Error",
    };
    try {
      setIsSubmitting(true);
      setOutput([{ testcase: 0, status: "Running", stdout: "Queued for judging..." }]);
      const queued = await apiFetch("/submissions", {
        method: "POST", signal: controller.signal,
        body: JSON.stringify({ problemSlug: problem.slug, language, code }),
      });
      while (!controller.signal.aborted) {
        const result = await apiFetch("/submissions/" + queued.submissionId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (["PENDING", "PROCESSING"].includes(result.status)) {
          setOutput([{ testcase: 0, status: "Running", stdout: result.status === "PENDING" ? "Queued for judging..." : "Judging all test cases..." }]);
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        setOutput([{
          testcase: result.failedTestcase || 0,
          status: labels[result.status] || "Execution Error",
          stdout: result.testcasesPassed + "/" + result.totalTestcases + " test cases passed",
        }]);
        if (result.status === "ACCEPTED") {
          setIsAlreadySolved(hasSolved);
          setHasSolved(true);
          setIsCelebrating(true);
          streakUpdatedRef.current = true;
          setCurrentStreak(result.streak);
          onSuccess?.(result.streak);
          setTimeout(() => setIsCelebrating(false), 7000);
        }
        break;
      }
    } catch (error: any) {
      if (!controller.signal.aborted) {
        setOutput([{ testcase: 0, status: "Error", stderr: error.message || "Could not check the submission. It may still be queued; check your submission history." }]);
      }
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  };

  const handleShowSolution = async () => {
    try {
      const data = await apiFetch(`/problems/${problem.slug}/solution`);
      
      // Close the celebration modal
      setIsCelebrating(false);
      
      // Display solution in a nice format (you can enhance this with a modal later)
      alert(`Solution for ${data.problemTitle}:\n\n${data.note}\n\nOnce solutions are added to the database, they will appear here with full explanations and code examples.`);
      
    } catch (err: any) {
      console.error("Failed to fetch solution:", err);
      alert("Failed to load solution. " + (err.message || "Please try again."));
    }
  };

  const Celebration = () => (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      {!isAlreadySolved && [...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0],
            x: (Math.random() - 0.5) * window.innerWidth,
            y: (Math.random() - 0.5) * window.innerHeight,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 2
          }}
          className="absolute"
        >
          {i % 3 === 0 ? <Star className="text-amber-400" size={24} /> :
            i % 3 === 1 ? <Trophy className="text-yellow-500" size={32} /> :
              <CheckCircle2 className="text-emerald-500" size={20} />}
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="bg-background/80 backdrop-blur-xl border-4 border-primary-custom/20 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 pointer-events-auto"
      >
        {isAlreadySolved ? (
          // Already Solved State
          <>
            <div className="relative">
              <CheckCircle2 size={100} className="text-emerald-500" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black mb-2 text-foreground">Problem Already Solved!</h2>
              <p className="text-lg text-slate-400 max-w-md">
                You've already solved this problem. No additional streak or points earned.
              </p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleShowSolution}
                  className="px-6 py-3 bg-primary-custom/10 hover:bg-primary-custom/20 border border-primary-custom/30 rounded-xl font-bold text-foreground transition-all"
                >
                  Show Solution
                </button>
                <button
                  onClick={() => setIsCelebrating(false)}
                  className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold text-emerald-500 transition-all"
                >
                  Attempt Again
                </button>
              </div>
            </div>
          </>
        ) : (
          // New Solve State (Original Celebration)
          <>
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Trophy size={120} className="text-yellow-500" />
              </motion.div>
              <motion.div
                className="absolute -top-4 -right-4 bg-emerald-500 text-white rounded-full p-3 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle2 size={32} />
              </motion.div>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">EXCELLENT!</h2>
              <p className="text-xl font-bold text-foreground">All Test Cases Passed</p>
              <div className="mt-6 flex items-center gap-3 justify-center">
                <Flame className="text-amber-500" size={32} />
                <span className="text-3xl font-black text-amber-500">{currentStreak}-DAY STREAK</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">

      {/* Problem Workspace Header */}
      <header className="h-14 bg-background/80 backdrop-blur-md border-b border-primary-custom/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/practice")}
            className="flex items-center gap-2 text-slate-400 hover:text-foreground transition-all group pr-4 border-r border-primary-custom/10"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm font-medium">Problems</span>
            <span className="text-slate-700 text-lg">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{problem.title}</span>
              {hasSolved && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <CheckCircle2 className="text-emerald-500" size={14} />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Solved</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full ${currentStreak > 1 ? 'streak-gradient shadow-lg shadow-amber-500/30' : 'bg-slate-600/50'}`}>
              <Flame className="text-white" size={16} />
              <span className="text-xs font-black text-white uppercase tracking-widest">{currentStreak} Day Streak</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
            <div className="w-24 h-1.5 bg-background border border-primary-custom/10 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence initial={false}>
          {!isExpanded && (
            <motion.div
              initial={{ width: leftWidth, opacity: 1, x: 0 }}
              animate={{ width: leftWidth, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="shrink-0 overflow-y-auto border-r border-primary-custom/10 custom-scrollbar overflow-hidden"
            >
              <div className="p-8" style={{ width: `${leftWidth}px` }}>
                <DescriptionPanel problem={problem} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resizer Handle */}
        {!isExpanded && (
          <div
            className="w-1.5 hover:w-2 bg-primary-custom/5 hover:bg-primary-custom/30 cursor-col-resize transition-all shrink-0 group relative z-50 flex items-center justify-center active:bg-primary-custom/50"
            onMouseDown={startResizingWidth}
          >
            <div className="h-8 w-1 bg-primary-custom/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Right Side: Editor & Console */}
        <motion.div
          layout
          id="right-panel"
          className="flex-1 flex flex-col bg-background min-w-0 h-full relative"
        >
          <EditorPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={handleLanguageChange}
            availableLanguages={availableLanguages}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            resetKey={resetKey}
          />

          {/* Console Resizer */}
          {!isExpanded && (
            <div
              className="h-1.5 hover:h-2 bg-primary-custom/5 hover:bg-primary-custom/30 cursor-row-resize transition-all shrink-0 group relative z-50 flex items-center justify-center active:bg-primary-custom/50"
              onMouseDown={startResizingHeight}
            >
              <div className="w-8 h-1 bg-primary-custom/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Console/Test Cases section */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-background"
              >
                <ConsolePanel
                  output={output}
                  testCases={problem.testCases}
                  height={consoleHeight}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Toolbar */}
          <div className="h-16 border-t border-primary-custom/10 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2 bg-background/60 hover:bg-background/80 text-foreground border border-primary-custom/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 group"
              >
                <RefreshCcw size={14} className="text-muted-custom group-hover:rotate-180 transition-transform duration-500" />
                Reset
              </button>
              <button
                onClick={runCode}
                disabled={isRunning || isSubmitting}
                className="px-5 py-2 bg-background/60 hover:bg-background/80 text-foreground border border-primary-custom/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={14} className="text-muted-custom" />
                {isRunning ? "Running..." : "Run Code"}
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="px-8 py-2 bg-primary-custom hover:brightness-110 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary-custom/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 group"
            >
              <Send size={16} className={isSubmitting ? "animate-pulse" : "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"} />
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
          <AnimatePresence>
            {isCelebrating && <Celebration />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
