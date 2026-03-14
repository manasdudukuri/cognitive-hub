import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Brain, Flame, Target, CheckCircle2, Clock, Plus, X, Settings2, Edit2, Check, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SkillManagerModal from '../components/SkillManagerModal';
import PdfPlannerModal from '../components/PdfPlannerModal';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { streak, skills, pomodoroSessionsToday, flashcards, addSkill, dailyTimeLimit, updateDailyTimeLimit } = useStore();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isManagingSkills, setIsManagingSkills] = useState(false);
  const [isPdfPlannerOpen, setIsPdfPlannerOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTimeLimit, setNewTimeLimit] = useState(dailyTimeLimit.toString());

  // Auto-sync existing flashcard topics to skills
  useEffect(() => {
    const missingSkills = new Set<string>();
    flashcards.forEach(card => {
      if (card.topic && !skills.some(s => s.name.toLowerCase() === card.topic.toLowerCase() && !s.deletedAt)) {
        missingSkills.add(card.topic);
      }
    });

    missingSkills.forEach(topic => {
      addSkill(topic);
    });
  }, [flashcards, skills, addSkill]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      addSkill(newSkillName.trim());
      setNewSkillName('');
      setIsAddingSkill(false);
    }
  };

  const handleSaveTimeLimit = () => {
    const time = parseInt(newTimeLimit);
    if (!isNaN(time) && time > 0) {
      updateDailyTimeLimit(time);
    } else {
      setNewTimeLimit(dailyTimeLimit.toString());
    }
    setIsEditingTime(false);
  };

  const dueCards = flashcards.filter(c => c.nextReview <= Date.now()).length;

  const problemSolvingTime = Math.round(dailyTimeLimit * 0.5);
  const spacedRepetitionTime = Math.round(dailyTimeLimit * 0.25);
  const conceptLearningTime = dailyTimeLimit - problemSolvingTime - spacedRepetitionTime;

  const chartData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return [...skills.filter(s => !s.deletedAt)]
      .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
      .map(skill => {
        const todayXP = skill.xpHistory?.[today] || 0;
        const yesterdayXP = skill.xpHistory?.[yesterday] || 0;
        
        let color = '#ef4444'; // red (skipped)
        let statusText = 'Skipped today';
        
        if (todayXP > 0) {
          if (todayXP > yesterdayXP) {
            color = '#10b981'; // emerald-500 (went up)
            statusText = `Increased XP today (+${todayXP})`;
          } else {
            color = '#3b82f6'; // blue-500 (consistent)
            statusText = `Consistent XP today (+${todayXP})`;
          }
        }
        
        return {
          ...skill,
          fill: color,
          statusText
        };
      });
  }, [skills]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-white mb-1">{data.name}</p>
          <p className="text-sm text-zinc-400">Level {data.level} ({data.xp} XP)</p>
          <p className="text-xs mt-2 font-medium" style={{ color: data.fill }}>
            {data.statusText}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-zinc-400 mt-1">Here's your cognitive learning summary for today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full font-medium">
            <Flame className="w-5 h-5" />
            {streak} Day Streak
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-indigo-400 mb-4">
            <Brain className="w-6 h-6" />
            <h2 className="font-semibold">Active Recall</h2>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{dueCards}</p>
            <p className="text-sm text-zinc-400">Cards due for review today</p>
          </div>
          <button 
            onClick={() => onNavigate('study')}
            className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            Start Review
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-emerald-400 mb-4">
            <Clock className="w-6 h-6" />
            <h2 className="font-semibold">Deep Work</h2>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{pomodoroSessionsToday}</p>
            <p className="text-sm text-zinc-400">Pomodoro sessions completed</p>
          </div>
          <button 
            onClick={() => onNavigate('pomodoro')}
            className="mt-6 w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 py-2 rounded-lg font-medium transition-colors"
          >
            Start Timer
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-blue-400">
              <Target className="w-6 h-6" />
              <h2 className="font-semibold">Daily Plan</h2>
            </div>
            {isEditingTime ? (
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={newTimeLimit}
                  onChange={(e) => setNewTimeLimit(e.target.value)}
                  className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                  min="10"
                  step="10"
                />
                <span className="text-xs text-zinc-500">min</span>
                <button onClick={handleSaveTimeLimit} className="text-blue-400 hover:text-blue-300">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setNewTimeLimit(dailyTimeLimit.toString());
                  setIsEditingTime(true);
                }}
                className="text-xs flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Edit Time Limit"
              >
                {dailyTimeLimit}m <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <ul className="space-y-3 mt-2">
            <li className="flex items-center gap-3 text-sm text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-zinc-600" />
              <span>{problemSolvingTime}m Problem Solving</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-zinc-600" />
              <span>{spacedRepetitionTime}m Spaced Repetition</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-zinc-600" />
              <span>{conceptLearningTime}m Concept Learning</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Subjects</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPdfPlannerOpen(true)}
              className="text-sm flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <FileText className="w-4 h-4" /> AI Planner
            </button>
            {!isAddingSkill && (
              <button 
                onClick={() => setIsAddingSkill(true)}
                className="text-sm flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            )}
            <button 
              onClick={() => setIsManagingSkills(true)}
              className="text-sm flex items-center gap-1 text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Manage
            </button>
          </div>
        </div>

        {isAddingSkill && (
          <form onSubmit={handleAddSkill} className="mb-6 flex items-center gap-2">
            <input
              autoFocus
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              placeholder="e.g. System Design"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Add
            </button>
            <button type="button" onClick={() => setIsAddingSkill(false)} className="text-zinc-500 hover:text-zinc-300 p-1.5">
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="w-full overflow-y-auto" style={{ maxHeight: '400px' }}>
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
              <p>No subjects added yet.</p>
              <p className="text-sm mt-2">Add a subject manually or use the AI Planner to extract from a syllabus.</p>
            </div>
          ) : (
            <div style={{ height: `${Math.max(256, chartData.length * 40)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout="vertical" 
                  margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} width={120} />
                  <Tooltip 
                    cursor={{ fill: '#27272a' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="level" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {isManagingSkills && (
        <SkillManagerModal onClose={() => setIsManagingSkills(false)} />
      )}
      {isPdfPlannerOpen && (
        <PdfPlannerModal onClose={() => setIsPdfPlannerOpen(false)} />
      )}
    </div>
  );
}
