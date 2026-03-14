import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer() {
  const { incrementPomodoro } = useStore();
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 20 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (mode === 'work') {
      incrementPomodoro();
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setMode('work');
      setTimeLeft(WORK_TIME);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') setTimeLeft(WORK_TIME);
    else if (mode === 'shortBreak') setTimeLeft(SHORT_BREAK);
    else setTimeLeft(LONG_BREAK);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'work') setTimeLeft(WORK_TIME);
    else if (newMode === 'shortBreak') setTimeLeft(SHORT_BREAK);
    else setTimeLeft(LONG_BREAK);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Timer className="w-8 h-8 text-emerald-400" />
          Deep Work Sessions
        </h1>
        <p className="text-zinc-400 mt-2">Focus on one task. No distractions.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-12 w-full max-w-md flex flex-col items-center shadow-2xl">
        <div className="flex bg-zinc-950 p-2 rounded-2xl mb-12 w-full justify-between">
          <button
            onClick={() => switchMode('work')}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
              mode === 'work' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Brain className="w-4 h-4" />
            Work
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
              mode === 'shortBreak' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Coffee className="w-4 h-4" />
            Short Break
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
              mode === 'longBreak' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Coffee className="w-4 h-4" />
            Long Break
          </button>
        </div>

        <div className="text-[7rem] font-bold text-white tracking-tighter font-mono leading-none mb-12">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleTimer}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105",
              isActive 
                ? "bg-zinc-800 text-white hover:bg-zinc-700" 
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            )}
          >
            {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2">
        {[1, 2, 3, 4].map((session) => (
          <div 
            key={session}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              session <= (sessionsCompleted % 4) || (sessionsCompleted > 0 && sessionsCompleted % 4 === 0)
                ? "bg-emerald-500" 
                : "bg-zinc-800"
            )}
          />
        ))}
      </div>
      <p className="text-zinc-500 text-sm mt-4">
        {sessionsCompleted} sessions completed today
      </p>
    </div>
  );
}
