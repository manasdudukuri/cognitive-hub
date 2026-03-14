import React, { useState } from 'react';
import { PenTool, Send, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function FeynmanMode() {
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!concept || !explanation) return;
    
    setIsAnalyzing(true);
    setFeedback('');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const prompt = `You are an expert tutor evaluating a student's understanding using the Feynman Technique.
      
Concept: ${concept}
Student's Explanation: ${explanation}

Please analyze the explanation and provide feedback in the following structure:
1. **Clarity & Simplicity:** Is it explained simply enough for a beginner to understand?
2. **Knowledge Gaps:** Are there any missing crucial parts or misunderstandings?
3. **Suggestions for Improvement:** How can the student improve their explanation?

Keep the feedback constructive, encouraging, and formatted in Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setFeedback(response.text || 'No feedback generated.');
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('An error occurred while analyzing your explanation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-indigo-400 mb-2">
          <PenTool className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-white">Feynman Technique</h1>
        </div>
        <p className="text-zinc-400">Explain a concept as simply as possible. AI will detect knowledge gaps.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="flex flex-col space-y-6 overflow-y-auto pr-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What concept are you explaining?</label>
            <input 
              value={concept}
              onChange={e => setConcept(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Dynamic Programming, Neural Networks, Limits"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Explain it like I'm 5</label>
            <textarea 
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Start typing your explanation here..."
            />
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!concept || !explanation || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-xl font-medium transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Explanation
              </>
            )}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Feedback
          </h2>
          
          {feedback ? (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{feedback}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center">
              <Send className="w-12 h-12 mb-4 opacity-20" />
              <p>Submit your explanation to receive detailed feedback on clarity and knowledge gaps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
