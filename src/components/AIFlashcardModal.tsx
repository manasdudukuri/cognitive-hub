import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { generateFlashcardsFromText } from '../services/geminiService';

interface Props {
  onClose: () => void;
  topic: string;
}

export default function AIFlashcardModal({ onClose, topic }: Props) {
  const { addFlashcard } = useStore();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const cards = await generateFlashcardsFromText(text, topic);
      setGeneratedCards(cards);
    } catch (err) {
      setError('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCards = () => {
    generatedCards.forEach(card => {
      addFlashcard({
        topic,
        type: card.type,
        question: card.question,
        answer: card.answer,
      });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Generate Flashcards with AI
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {generatedCards.length === 0 ? (
            <div className="space-y-6">
              <p className="text-zinc-300">
                Paste your notes, article, or pre-formatted flashcards (e.g., "Front: ... Back: ...") below. The AI will automatically extract or generate question/answer and fill-in-the-blank flashcards for the topic <strong>{topic}</strong>.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text or flashcards here...&#10;&#10;Example:&#10;Flashcard 1&#10;Front: Formula for First Quartile (Q1)&#10;Back: Q1 = (n + 1) / 4 th item"
                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!text.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Cards...
                  </>
                ) : (
                  'Generate Flashcards'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">Successfully generated {generatedCards.length} flashcards!</p>
              </div>

              <div className="space-y-3">
                {generatedCards.map((card, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 uppercase tracking-wider">
                        {card.type === 'qa' ? 'Q&A' : 'Fill Blank'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white mb-2">Q: {card.question}</p>
                    <p className="text-sm text-indigo-300">A: {card.answer}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setGeneratedCards([])}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleAddCards}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Add to Deck
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
