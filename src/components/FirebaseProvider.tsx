import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Load user profile
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              useStore.setState({
                streak: data.streak || 0,
                lastStudyDate: data.lastStudyDate || null,
                pomodoroSessionsToday: data.pomodoroSessionsToday || 0,
                dailyTimeLimit: data.dailyTimeLimit || 120,
              });
            } else {
              // Create user profile
              const newProfile = {
                email: currentUser.email || '',
                streak: 0,
                pomodoroSessionsToday: 0,
                dailyTimeLimit: 120,
              };
              if (currentUser.displayName) (newProfile as any).displayName = currentUser.displayName;
              if (currentUser.photoURL) (newProfile as any).photoURL = currentUser.photoURL;
              
              await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            }
          } catch (e) {
            console.error("Error loading/creating user profile:", e);
          }

          try {
            // Load skills
            const skillsSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'skills'));
            const skills = skillsSnapshot.docs.map(d => d.data() as any);
            
            // Load flashcards
            const flashcardsSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'flashcards'));
            const flashcards = flashcardsSnapshot.docs.map(d => d.data() as any);

            // Load mistakes
            const mistakesSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'mistakes'));
            const mistakes = mistakesSnapshot.docs.map(d => d.data() as any);

            useStore.setState({ skills, flashcards, mistakes });
          } catch (e) {
            console.error("Error loading collections:", e);
          }
        } catch (error) {
          console.error("Error loading data from Firestore:", error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      useStore.setState({ skills: [], flashcards: [], mistakes: [], streak: 0, pomodoroSessionsToday: 0 });
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
