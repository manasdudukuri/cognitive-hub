import React, { useState } from 'react';
import { CalendarDays, Send, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function WeeklySynthesis() {
  const [algorithms, setAlgorithms] = useState('');
  const [mathConcepts, setMathConcepts] = useState('');
  const [problemsSolved, setProblemsSolved] = useState('');
  const [confusingConcepts, setConfusingConcepts] = useState('');
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!algorithms && !mathConcepts && !problemsSolved && !confusingConcepts) return;
    
    setIsGenerating(true);
    setReport('');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const prompt = `You are an expert academic advisor for a Computer Science and Mathematics student.
      
Here is the student's weekly synthesis:
Algorithms Learned: ${algorithms}
Math Concepts Learned: ${mathConcepts}
Problems Solved: ${problemsSolved}
Still Confusing: ${confusingConcepts}

Please generate a structured weekly learning report. Include:
1. **Progress Summary:** A brief encouraging summary of their week.
2. **Knowledge Connections:** How do the algorithms and math concepts they learned relate to each other? (e.g., how does linear algebra relate to ML algorithms they studied).
3. **Action Plan for Confusing Concepts:** Specific, actionable advice or study strategies to tackle the concepts they found confusing.
4. **Next Week's Focus:** Suggestions for what to study next based on this week's progress.

Format the report beautifully in Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setReport(response.text || 'No report generated.');
    } catch (error) {
      console.error('Error generating report:', error);
      setReport('An error occurred while generating your report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-blue-400 mb-2">
          <CalendarDays className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-white">Weekly Synthesis</h1>
        </div>
        <p className="text-zinc-400">Reflect on your week's learning to solidify long-term retention.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="flex flex-col space-y-6 overflow-y-auto pr-4 pb-8">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What algorithms or data structures did you learn?</label>
            <textarea 
              value={algorithms}
              onChange={e => setAlgorithms(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="e.g. Dijkstra's, AVL Trees..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What math concepts did you learn?</label>
            <textarea 
              value={mathConcepts}
              onChange={e => setMathConcepts(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="e.g. Eigenvectors, Bayes' Theorem..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What key problems did you solve?</label>
            <textarea 
              value={problemsSolved}
              onChange={e => setProblemsSolved(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="e.g. LeetCode 75, implemented a neural net from scratch..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What concepts are still confusing?</label>
            <textarea 
              value={confusingConcepts}
              onChange={e => setConfusingConcepts(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="e.g. I still don't fully grasp backpropagation..."
            />
          </div>

          <button 
            onClick={handleGenerateReport}
            disabled={(!algorithms && !mathConcepts && !problemsSolved && !confusingConcepts) || isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-xl font-medium transition-colors mt-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate AI Learning Report
              </>
            )}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Weekly Learning Report
          </h2>
          
          {report ? (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{report}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center">
              <Send className="w-12 h-12 mb-4 opacity-20" />
              <p>Fill out your weekly synthesis and generate an AI-powered report to connect concepts and plan your next week.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
