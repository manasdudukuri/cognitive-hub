import React, { useState } from 'react';
import { useStore, Mistake } from '../store/useStore';
import { AlertCircle, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { format } from 'date-fns';

export default function MistakeJournal() {
  const { mistakes, addMistake, markMistakeReviewed } = useStore();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [problem, setProblem] = useState('');
  const [incorrectAnswer, setIncorrectAnswer] = useState('');
  const [correctSolution, setCorrectSolution] = useState('');
  const [explanation, setExplanation] = useState('');
  const [type, setType] = useState<Mistake['type']>('concept');

  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault();
    addMistake({ problem, incorrectAnswer, correctSolution, explanation, type });
    setProblem('');
    setIncorrectAnswer('');
    setCorrectSolution('');
    setExplanation('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            Log a Mistake
          </h1>
          <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleAddMistake} className="space-y-6 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Mistake Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as Mistake['type'])}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
            >
              <option value="concept">Concept Error</option>
              <option value="calculation">Calculation Error</option>
              <option value="misunderstanding">Misunderstood Question</option>
              <option value="careless">Careless Mistake</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Problem / Question</label>
            <textarea 
              required
              value={problem}
              onChange={e => setProblem(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
              placeholder="What was the original problem?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Your Incorrect Answer</label>
              <textarea 
                required
                value={incorrectAnswer}
                onChange={e => setIncorrectAnswer(e.target.value)}
                rows={4}
                className="w-full bg-zinc-950 border border-red-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                placeholder="What did you answer?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Correct Solution</label>
              <textarea 
                required
                value={correctSolution}
                onChange={e => setCorrectSolution(e.target.value)}
                rows={4}
                className="w-full bg-zinc-950 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                placeholder="What is the actual answer?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Why did you make this mistake?</label>
            <textarea 
              required
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
              placeholder="Explain the root cause of the error to prevent it next time."
            />
          </div>

          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors">
            Save to Journal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            Mistake Journal
          </h1>
          <p className="text-zinc-400 mt-1">Analyze your errors to prevent repeating them.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Mistake
        </button>
      </header>

      {mistakes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center">
          <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
          <p>Your mistake journal is empty. Log errors here to learn from them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 overflow-y-auto pb-8">
          {mistakes.map((mistake) => (
            <div key={mistake.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold",
                    mistake.type === 'concept' ? "bg-purple-500/10 text-purple-400" :
                    mistake.type === 'calculation' ? "bg-blue-500/10 text-blue-400" :
                    mistake.type === 'misunderstanding' ? "bg-orange-500/10 text-orange-400" :
                    "bg-zinc-800 text-zinc-400"
                  )}>
                    {mistake.type}
                  </span>
                  <span className="text-zinc-500 text-sm">{format(mistake.date, 'MMM d, yyyy')}</span>
                </div>
                {!mistake.reviewed && (
                  <button 
                    onClick={() => markMistakeReviewed(mistake.id)}
                    className="flex items-center gap-2 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Reviewed
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Problem</h4>
                  <div className="prose prose-invert max-w-none text-sm bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{mistake.problem}</ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-500 mb-1">Incorrect Answer</h4>
                    <div className="prose prose-invert max-w-none text-sm bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{mistake.incorrectAnswer}</ReactMarkdown>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-500 mb-1">Correct Solution</h4>
                    <div className="prose prose-invert max-w-none text-sm bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{mistake.correctSolution}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Explanation / Root Cause</h4>
                  <div className="prose prose-invert max-w-none text-sm bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{mistake.explanation}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
