import React, { useState, useMemo } from 'react';
import { useStore, CardType, Flashcard } from '../store/useStore';
import { Brain, Plus, Check, X, RotateCcw, Sparkles, Layers, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import AIFlashcardModal from '../components/AIFlashcardModal';

export default function StudySession() {
  const { flashcards, addFlashcard, updateCardReview } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<CardType>('qa');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // Study state
  const [isStudying, setIsStudying] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const decks = useMemo(() => {
    const deckMap = new Map<string, { total: number; due: number }>();
    const now = Date.now();
    flashcards.forEach(card => {
      const isDue = card.nextReview <= now;
      if (!deckMap.has(card.topic)) {
        deckMap.set(card.topic, { total: 0, due: 0 });
      }
      const stats = deckMap.get(card.topic)!;
      stats.total += 1;
      if (isDue) stats.due += 1;
    });
    return Array.from(deckMap.entries()).map(([topicName, stats]) => ({ topic: topicName, ...stats }));
  }, [flashcards]);

  const totalDue = decks.reduce((sum, deck) => sum + deck.due, 0);

  const startStudy = (selectedTopic?: string) => {
    const now = Date.now();
    let cards = flashcards.filter(c => c.nextReview <= now);
    if (selectedTopic) {
      cards = cards.filter(c => c.topic === selectedTopic);
    }
    // Shuffle cards once when starting the session
    setStudyQueue(cards.sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsStudying(true);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    addFlashcard({ topic, type, question, answer });
    setTopic('');
    setQuestion('');
    setAnswer('');
    setIsAdding(false);
  };

  const handleReview = (quality: number) => {
    if (studyQueue[currentCardIndex]) {
      updateCardReview(studyQueue[currentCardIndex].id, quality);
      setShowAnswer(false);
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  if (isAdding) {
    return (
      <div className="p-8 max-w-3xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Add New Flashcard</h1>
          <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleAddCard} className="space-y-6 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Topic</label>
              <input 
                required
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Graph Algorithms, Calculus"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!topic.trim()) {
                  alert("Please enter a topic first to generate flashcards.");
                  return;
                }
                setIsAIGenerating(true);
              }}
              className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded-lg font-medium transition-colors h-[42px]"
            >
              <Sparkles className="w-4 h-4" />
              Auto-Generate
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Card Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as CardType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="qa">Basic Q/A</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="code">Code Completion</option>
              <option value="algorithm">Algorithm Steps</option>
              <option value="math">Math Derivation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Question (Markdown supported)</label>
            <textarea 
              required
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="What is the time complexity of QuickSort?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Answer (Markdown supported)</label>
            <textarea 
              required
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="Average case: O(n log n), Worst case: O(n^2)"
            />
          </div>

          <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-medium transition-colors">
            Save Card
          </button>
        </form>

        {isAIGenerating && (
          <AIFlashcardModal 
            topic={topic} 
            onClose={() => {
              setIsAIGenerating(false);
              setIsAdding(false);
            }} 
          />
        )}
      </div>
    );
  }

  if (!isStudying) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Decks</h1>
            <p className="text-zinc-400 mt-1">Select a topic to study or review all due cards.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </header>

        {decks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <Layers className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No flashcards yet</h2>
            <p className="text-zinc-400 mb-8 max-w-md">
              Create your first flashcard to start building your knowledge base.
            </p>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Cards
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {totalDue > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Study All Due Cards</h2>
                  <p className="text-indigo-300">{totalDue} cards due across all topics</p>
                </div>
                <button
                  onClick={() => startStudy()}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decks.map(deck => (
                <div key={deck.topic} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{deck.topic}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded-md font-medium",
                        deck.due > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {deck.due} due
                      </span>
                      <span className="text-zinc-500">{deck.total} total</span>
                    </div>
                  </div>
                  <button
                    onClick={() => startStudy(deck.topic)}
                    disabled={deck.due === 0}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 text-white py-2.5 rounded-xl font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Study Topic
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (studyQueue.length === 0 || currentCardIndex >= studyQueue.length) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">You're all caught up!</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          You've completed all your scheduled reviews for this session. Great job maintaining your spaced repetition schedule.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsStudying(false)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Decks
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Cards
          </button>
        </div>
      </div>
    );
  }

  const currentCard = studyQueue[currentCardIndex];

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Session</h1>
          <p className="text-zinc-400 mt-1">Card {currentCardIndex + 1} of {studyQueue.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsStudying(false)}
            className="text-zinc-400 hover:text-white px-4 py-2 font-medium transition-colors text-sm"
          >
            End Session
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 min-h-[400px] flex flex-col relative">
          <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold">
            {currentCard.topic} • {currentCard.type}
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 text-center">Question</h3>
            <div className="prose prose-invert max-w-none text-center">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{currentCard.question}</ReactMarkdown>
            </div>
          </div>

          {showAnswer && (
            <div className="flex-1 flex flex-col justify-center border-t border-zinc-800 mt-8 pt-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 text-center">Answer</h3>
              <div className="prose prose-invert max-w-none text-center">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{currentCard.answer}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 w-full">
          {!showAnswer ? (
            <button 
              onClick={() => setShowAnswer(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-xl font-medium transition-colors text-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Reveal Answer
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <button onClick={() => handleReview(1)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-medium transition-colors">
                Again (1)
              </button>
              <button onClick={() => handleReview(3)} className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 py-3 rounded-xl font-medium transition-colors">
                Hard (3)
              </button>
              <button onClick={() => handleReview(4)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-3 rounded-xl font-medium transition-colors">
                Good (4)
              </button>
              <button onClick={() => handleReview(5)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-3 rounded-xl font-medium transition-colors">
                Easy (5)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
