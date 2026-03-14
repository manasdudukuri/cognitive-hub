import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export type CardType = 'qa' | 'fill-blank' | 'code' | 'algorithm' | 'math';

export interface Flashcard {
  id: string;
  topic: string;
  type: CardType;
  question: string;
  answer: string;
  codeSnippet?: string;
  diagramUrl?: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface Mistake {
  id: string;
  problem: string;
  incorrectAnswer: string;
  correctSolution: string;
  explanation: string;
  type: 'concept' | 'calculation' | 'misunderstanding' | 'careless';
  date: number;
  reviewed: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  description?: string;
  category?: string;
  difficulty?: number;
  masteryGoal?: number;
  parentId?: string;
  deletedAt?: number;
  xpHistory?: Record<string, number>;
}

interface AppState {
  flashcards: Flashcard[];
  mistakes: Mistake[];
  skills: Skill[];
  streak: number;
  lastStudyDate: number | null;
  pomodoroSessionsToday: number;
  dailyTimeLimit: number; // in minutes
  
  addFlashcard: (card: Omit<Flashcard, 'id' | 'nextReview' | 'interval' | 'easeFactor' | 'repetitions'>) => void;
  updateCardReview: (id: string, quality: number) => void;
  addMistake: (mistake: Omit<Mistake, 'id' | 'date' | 'reviewed'>) => void;
  markMistakeReviewed: (id: string) => void;
  addXP: (skillName: string, amount: number) => void;
  addSkill: (name: string, details?: Partial<Skill>) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  removeSkill: (id: string, option: 'delete-all' | 'unlink' | 'merge', mergeTargetId?: string) => void;
  recoverSkill: (id: string) => void;
  permanentlyDeleteSkill: (id: string) => void;
  incrementPomodoro: () => void;
  updateStreak: () => void;
  updateDailyTimeLimit: (minutes: number) => void;
}

const initialSkills: Skill[] = [];

const syncUserDoc = async (data: Partial<AppState>) => {
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), data, { merge: true });
    } catch (e) {
      console.error("Error syncing user doc", e);
    }
  }
};

const syncSubDoc = async (collectionName: string, id: string, data: any) => {
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, collectionName, id), data, { merge: true });
    } catch (e) {
      console.error(`Error syncing ${collectionName} doc`, e);
    }
  }
};

const deleteSubDoc = async (collectionName: string, id: string) => {
  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, collectionName, id));
    } catch (e) {
      console.error(`Error deleting ${collectionName} doc`, e);
    }
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      flashcards: [],
      mistakes: [],
      skills: initialSkills,
      streak: 0,
      lastStudyDate: null,
      pomodoroSessionsToday: 0,
      dailyTimeLimit: 120, // Default 2 hours

      addFlashcard: (card) => set((state) => {
        const newCard = {
          ...card,
          id: crypto.randomUUID(),
          nextReview: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
        };
        syncSubDoc('flashcards', newCard.id, newCard);
        
        const newState: Partial<AppState> = {
          flashcards: [...state.flashcards, newCard]
        };

        if (!state.skills.some(s => s.name.toLowerCase() === card.topic.toLowerCase() && !s.deletedAt)) {
          const newSkill: Skill = {
            id: crypto.randomUUID(),
            name: card.topic,
            level: 1,
            xp: 0,
            xpHistory: {}
          };
          syncSubDoc('skills', newSkill.id, newSkill);
          newState.skills = [...state.skills, newSkill];
        }

        return newState as AppState;
      }),

      updateCardReview: (id, quality) => set((state) => {
        let xpGained = 0;
        let topic = '';

        const updatedCards = state.flashcards.map(card => {
          if (card.id !== id) return card;
          topic = card.topic;
          
          // SuperMemo-2 Algorithm
          let { interval, easeFactor, repetitions } = card;
          
          if (quality >= 3) {
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 6;
            else interval = Math.round(interval * easeFactor);
            repetitions += 1;
            xpGained = quality * 2; // e.g., 6, 8, or 10 XP
          } else {
            repetitions = 0;
            interval = 1;
          }
          
          easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
          if (easeFactor < 1.3) easeFactor = 1.3;

          const updatedCard = {
            ...card,
            interval,
            easeFactor,
            repetitions,
            nextReview: Date.now() + interval * 24 * 60 * 60 * 1000
          };
          syncSubDoc('flashcards', updatedCard.id, updatedCard);
          return updatedCard;
        });

        const newState: Partial<AppState> = { flashcards: updatedCards };

        if (xpGained > 0 && topic) {
          const today = new Date().toISOString().split('T')[0];
          newState.skills = state.skills.map(skill => {
            if (skill.name !== topic) return skill;
            const newXp = skill.xp + xpGained;
            const newLevel = Math.floor(newXp / 100) + 1;
            const xpHistory = { ...(skill.xpHistory || {}) };
            xpHistory[today] = (xpHistory[today] || 0) + xpGained;
            const updated = { ...skill, xp: newXp, level: newLevel, xpHistory };
            syncSubDoc('skills', skill.id, updated);
            return updated;
          });
        }

        return newState as AppState;
      }),

      addMistake: (mistake) => set((state) => {
        const newMistake = {
          ...mistake,
          id: crypto.randomUUID(),
          date: Date.now(),
          reviewed: false
        };
        syncSubDoc('mistakes', newMistake.id, newMistake);
        return {
          mistakes: [newMistake, ...state.mistakes]
        };
      }),

      markMistakeReviewed: (id) => set((state) => {
        const updatedMistakes = state.mistakes.map(m => {
          if (m.id === id) {
            const updated = { ...m, reviewed: true };
            syncSubDoc('mistakes', id, updated);
            return updated;
          }
          return m;
        });
        return { mistakes: updatedMistakes };
      }),

      addXP: (skillName, amount) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const updatedSkills = state.skills.map(skill => {
          if (skill.name !== skillName) return skill;
          const newXp = skill.xp + amount;
          const newLevel = Math.floor(newXp / 100) + 1;
          const xpHistory = { ...(skill.xpHistory || {}) };
          xpHistory[today] = (xpHistory[today] || 0) + amount;
          const updated = { ...skill, xp: newXp, level: newLevel, xpHistory };
          syncSubDoc('skills', skill.id, updated);
          return updated;
        });
        return { skills: updatedSkills };
      }),

      addSkill: (name, details) => set((state) => {
        if (state.skills.some(s => s.name.toLowerCase() === name.toLowerCase() && !s.deletedAt)) {
          return state;
        }
        const newSkill = { id: crypto.randomUUID(), name, level: 1, xp: 0, ...details };
        syncSubDoc('skills', newSkill.id, newSkill);
        return {
          skills: [...state.skills, newSkill]
        };
      }),

      updateSkill: (id, updates) => set((state) => {
        const skillToUpdate = state.skills.find(s => s.id === id || s.name === id);
        if (!skillToUpdate) return state;

        const oldName = skillToUpdate.name;
        const newName = updates.name || oldName;

        const updatedSkills = state.skills.map(skill => {
          if (skill.id === id || skill.name === id) {
            const updated = { ...skill, ...updates };
            syncSubDoc('skills', updated.id, updated);
            return updated;
          }
          return skill;
        });

        const updatedFlashcards = oldName !== newName 
          ? state.flashcards.map(f => {
              if (f.topic === oldName) {
                const updated = { ...f, topic: newName };
                syncSubDoc('flashcards', updated.id, updated);
                return updated;
              }
              return f;
            })
          : state.flashcards;

        return {
          skills: updatedSkills,
          flashcards: updatedFlashcards
        };
      }),

      removeSkill: (id, option, mergeTargetId) => set((state) => {
        const skillToRemove = state.skills.find(s => s.id === id || s.name === id);
        if (!skillToRemove) return state;

        const skillName = skillToRemove.name;
        let updatedFlashcards = [...state.flashcards];
        let updatedSkills = [...state.skills];

        if (option === 'delete-all') {
          updatedFlashcards = updatedFlashcards.filter(f => {
            if (f.topic === skillName) {
              deleteSubDoc('flashcards', f.id);
              return false;
            }
            return true;
          });
          updatedSkills = updatedSkills.map(s => {
            if (s.id === id || s.name === id) {
              const updated = { ...s, deletedAt: Date.now() };
              syncSubDoc('skills', updated.id, updated);
              return updated;
            }
            return s;
          });
        } else if (option === 'unlink') {
          updatedFlashcards = updatedFlashcards.map(f => {
            if (f.topic === skillName) {
              const updated = { ...f, topic: 'Uncategorized' };
              syncSubDoc('flashcards', updated.id, updated);
              return updated;
            }
            return f;
          });
          updatedSkills = updatedSkills.map(s => {
            if (s.id === id || s.name === id) {
              const updated = { ...s, deletedAt: Date.now() };
              syncSubDoc('skills', updated.id, updated);
              return updated;
            }
            return s;
          });
        } else if (option === 'merge' && mergeTargetId) {
          const targetSkill = state.skills.find(s => s.id === mergeTargetId || s.name === mergeTargetId);
          if (targetSkill) {
            updatedFlashcards = updatedFlashcards.map(f => {
              if (f.topic === skillName) {
                const updated = { ...f, topic: targetSkill.name };
                syncSubDoc('flashcards', updated.id, updated);
                return updated;
              }
              return f;
            });
            updatedSkills = updatedSkills.map(s => {
              if (s.id === mergeTargetId || s.name === mergeTargetId) {
                const newXp = s.xp + skillToRemove.xp;
                const updated = { ...s, xp: newXp, level: Math.floor(newXp / 100) + 1 };
                syncSubDoc('skills', updated.id, updated);
                return updated;
              }
              if (s.id === id || s.name === id) {
                const updated = { ...s, deletedAt: Date.now() };
                syncSubDoc('skills', updated.id, updated);
                return updated;
              }
              return s;
            });
          }
        }

        // Handle hierarchy: child skills reassigned to parent or standalone
        updatedSkills = updatedSkills.map(s => {
          if (s.parentId === id || s.parentId === skillToRemove.name) {
            const updated = { ...s, parentId: skillToRemove.parentId || undefined };
            syncSubDoc('skills', updated.id, updated);
            return updated;
          }
          return s;
        });

        return {
          skills: updatedSkills,
          flashcards: updatedFlashcards
        };
      }),

      recoverSkill: (id) => set((state) => {
        const updatedSkills = state.skills.map(s => {
          if (s.id === id || s.name === id) {
            const updated = { ...s, deletedAt: undefined };
            syncSubDoc('skills', updated.id, updated);
            return updated;
          }
          return s;
        });
        return { skills: updatedSkills };
      }),

      permanentlyDeleteSkill: (id) => set((state) => {
        const skillToDelete = state.skills.find(s => s.id === id || s.name === id);
        if (skillToDelete) {
          deleteSubDoc('skills', skillToDelete.id);
        }
        return {
          skills: state.skills.filter(s => s.id !== id && s.name !== id)
        };
      }),

      incrementPomodoro: () => set((state) => {
        const newVal = state.pomodoroSessionsToday + 1;
        syncUserDoc({ pomodoroSessionsToday: newVal });
        return { pomodoroSessionsToday: newVal };
      }),

      updateDailyTimeLimit: (minutes) => set((state) => {
        syncUserDoc({ dailyTimeLimit: minutes });
        return { dailyTimeLimit: minutes };
      }),

      updateStreak: () => set((state) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        if (!state.lastStudyDate) {
          syncUserDoc({ streak: 1, lastStudyDate: today });
          return { streak: 1, lastStudyDate: today };
        }
        
        const diffDays = Math.floor((today - state.lastStudyDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          const newStreak = state.streak + 1;
          syncUserDoc({ streak: newStreak, lastStudyDate: today });
          return { streak: newStreak, lastStudyDate: today };
        } else if (diffDays > 1) {
          syncUserDoc({ streak: 1, lastStudyDate: today });
          return { streak: 1, lastStudyDate: today };
        }
        
        return state;
      })
    }),
    {
      name: 'cognitive-hub-storage',
    }
  )
);
