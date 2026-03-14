import React, { useState, useEffect, useMemo } from 'react';
import { Target, Lightbulb, Clock, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateDeliberatePracticeProblem } from '../services/geminiService';

interface Problem {
  id: string;
  topic: string;
  difficulty: number;
  question: string;
  hints: string[];
  solution: string;
}

export default function DeliberatePractice() {
  const { addXP, flashcards } = useStore();
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get unique topics from flashcards
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    flashcards.forEach(f => {
      if (f.topic) topics.add(f.topic);
    });
    return Array.from(topics).sort();
  }, [flashcards]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !showSolution) {
      interval = setInterval(() => {
        setTimeSpent(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, showSolution]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerateProblem = async () => {
    if (!selectedTopic) return;
    
    setIsGenerating(true);
    try {
      const topicFlashcards = flashcards.filter(f => f.topic === selectedTopic);
      const problemData = await generateDeliberatePracticeProblem(selectedTopic, topicFlashcards);
      
      setCurrentProblem({
        id: crypto.randomUUID(),
        topic: selectedTopic,
        difficulty: problemData.difficulty || 3,
        question: problemData.question,
        hints: problemData.hints || [],
        solution: problemData.solution
      });
      
      setHintsRevealed(0);
      setShowSolution(false);
      setTimeSpent(0);
      setIsActive(true);
    } catch (error) {
      console.error("Failed to generate problem:", error);
      alert("Failed to generate problem. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    setShowSolution(true);
    setIsActive(false);
    // Award XP based on hints not used
    if (currentProblem) {
      const xpEarned = Math.max(10, 50 - (hintsRevealed * 10));
      addXP(currentProblem.topic, xpEarned);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="w-6 h-6 text-indigo-400" />
            Deliberate Practice
          </h1>
          <p className="text-zinc-400 mt-1">Tackle challenging problems slightly above your current level.</p>
        </div>
        {currentProblem && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300 font-mono">
            <Clock className="w-4 h-4 text-indigo-400" />
            {formatTime(timeSpent)}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pb-8">
        {!currentProblem ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-xl mx-auto mt-12">
            <h2 className="text-xl font-semibold text-white mb-6">Start Practice Session</h2>
            
            {availableTopics.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">You need to add some flashcards with topics first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Select a Topic to Practice</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="" disabled>Choose a topic...</option>
                    {availableTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleGenerateProblem}
                  disabled={!selectedTopic || isGenerating}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Problem...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Practice
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold">
                    {currentProblem.topic}
                  </span>
                  <span className="text-zinc-500 text-sm">Difficulty: Level {currentProblem.difficulty}</span>
                </div>
                <button 
                  onClick={() => setCurrentProblem(null)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  End Session
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentProblem.question}
                </ReactMarkdown>
              </div>
            </div>

            {!showSolution && (
              <div className="space-y-4">
                {currentProblem.hints.map((hint, index) => (
                  <div key={index}>
                    {hintsRevealed > index ? (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3 animate-in fade-in">
                        <Lightbulb className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <p className="text-orange-200/90 text-sm">{hint}</p>
                      </div>
                    ) : hintsRevealed === index ? (
                      <button 
                        onClick={() => setHintsRevealed(prev => prev + 1)}
                        className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Reveal Hint {index + 1}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {showSolution ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-semibold text-emerald-400 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Worked Solution
                </h3>
                <div className="prose prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentProblem.solution}
                  </ReactMarkdown>
                </div>
                
                <button 
                  onClick={handleGenerateProblem}
                  disabled={isGenerating}
                  className="mt-8 w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isGenerating ? 'Generating...' : 'Next Problem'}
                </button>
              </div>
            ) : (
              <button 
                onClick={handleComplete}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-xl font-medium transition-colors mt-8"
              >
                I've solved it (Show Solution)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

