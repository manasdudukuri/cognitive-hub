/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Brain, 
  BookOpen, 
  Timer, 
  PenTool, 
  BarChart3, 
  AlertCircle, 
  CalendarDays,
  Target,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import StudySession from './pages/StudySession';
import FeynmanMode from './pages/FeynmanMode';
import PomodoroTimer from './pages/PomodoroTimer';
import MistakeJournal from './pages/MistakeJournal';
import WeeklySynthesis from './pages/WeeklySynthesis';
import DeliberatePractice from './pages/DeliberatePractice';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import Login from './components/Login';

type Tab = 'dashboard' | 'study' | 'feynman' | 'pomodoro' | 'journal' | 'synthesis' | 'practice';

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'study', label: 'Spaced Repetition', icon: Brain },
    { id: 'practice', label: 'Deliberate Practice', icon: Target },
    { id: 'feynman', label: 'Feynman Mode', icon: PenTool },
    { id: 'pomodoro', label: 'Deep Work', icon: Timer },
    { id: 'journal', label: 'Mistake Journal', icon: AlertCircle },
    { id: 'synthesis', label: 'Weekly Synthesis', icon: CalendarDays },
  ] as const;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Cognitive Hub</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'study' && <StudySession />}
        {activeTab === 'practice' && <DeliberatePractice />}
        {activeTab === 'feynman' && <FeynmanMode />}
        {activeTab === 'pomodoro' && <PomodoroTimer />}
        {activeTab === 'journal' && <MistakeJournal />}
        {activeTab === 'synthesis' && <WeeklySynthesis />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AuthWrapper />
    </FirebaseProvider>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Handled by FirebaseProvider
  if (!user) return <Login />;
  
  return <MainApp />;
}
