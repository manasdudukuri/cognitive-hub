import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { generatePlanFromPdf } from '../services/geminiService';

interface Props {
  onClose: () => void;
}

export default function PdfPlannerModal({ onClose }: Props) {
  const { addSkill } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSkills, setGeneratedSkills] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsGenerating(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        try {
          const skills = await generatePlanFromPdf(base64String, file.type);
          setGeneratedSkills(skills);
        } catch (err) {
          setError('Failed to analyze the document. Please try again.');
        } finally {
          setIsGenerating(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsGenerating(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsGenerating(false);
    }
  };

  const handleAddSkills = () => {
    generatedSkills.forEach(skill => {
      addSkill(skill.name, {
        description: skill.description,
        category: skill.category,
        difficulty: skill.difficulty,
        masteryGoal: skill.masteryGoal,
      });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            AI Study Planner
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {generatedSkills.length === 0 ? (
            <div className="space-y-6">
              <p className="text-zinc-300">
                Upload your lecture notes, syllabus, or study guide (PDF). Our AI will analyze it and automatically generate a structured study plan with subjects to master.
              </p>

              <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors bg-zinc-950/50">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-indigo-400 font-medium">Click to upload</span>
                    <span className="text-zinc-500"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-zinc-500">PDF files only (max 10MB)</p>
                </label>
              </div>

              {file && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-white truncate flex-1">{file.name}</span>
                  <span className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!file || isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  'Generate Study Plan'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">Successfully extracted {generatedSkills.length} subjects!</p>
              </div>

              <div className="space-y-3">
                {generatedSkills.map((skill, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{skill.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                        Level {skill.difficulty}/10
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{skill.description}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="px-2 py-0.5 rounded bg-zinc-800/50">{skill.category}</span>
                      <span>Goal: Level {skill.masteryGoal}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setGeneratedSkills([])}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleAddSkills}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Add to My Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
