import React, { useState } from 'react';
import { useStore, Skill } from '../store/useStore';
import { X, Edit2, Trash2, AlertTriangle, ArrowLeft, Save, RefreshCw } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function SkillManagerModal({ onClose }: Props) {
  const { skills, flashcards, updateSkill, removeSkill, recoverSkill, permanentlyDeleteSkill } = useStore();
  
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const activeSkills = skills.filter(s => !s.deletedAt);
  const deletedSkills = skills.filter(s => s.deletedAt);
  
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [isBulkGrouping, setIsBulkGrouping] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkParentId, setBulkParentId] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Skill>>({});

  // Delete form state
  const [deleteOption, setDeleteOption] = useState<'delete-all' | 'unlink' | 'merge'>('unlink');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  const handleEditClick = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditForm({
      name: skill.name,
      description: skill.description || '',
      category: skill.category || '',
      difficulty: skill.difficulty || 1,
      masteryGoal: skill.masteryGoal || 10,
      parentId: skill.parentId || ''
    });
  };

  const handleSaveEdit = () => {
    if (editingSkillId && editForm.name?.trim()) {
      updateSkill(editingSkillId, editForm);
      setEditingSkillId(null);
    }
  };

  const handleDeleteClick = (skill: Skill) => {
    setDeletingSkillId(skill.id);
    setDeleteOption('unlink');
    setMergeTargetId('');
  };

  const confirmDelete = () => {
    if (deletingSkillId) {
      if (deleteOption === 'merge' && !mergeTargetId) return;
      removeSkill(deletingSkillId, deleteOption, mergeTargetId);
      setDeletingSkillId(null);
    }
  };

  const toggleSkillSelection = (id: string) => {
    const newSelected = new Set(selectedSkillIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSkillIds(newSelected);
  };

  const handleBulkGroup = () => {
    selectedSkillIds.forEach(id => {
      const updates: Partial<Skill> = {};
      if (bulkCategory) updates.category = bulkCategory;
      if (bulkParentId) updates.parentId = bulkParentId;
      
      if (Object.keys(updates).length > 0) {
        updateSkill(id, updates);
      }
    });
    setIsBulkGrouping(false);
    setSelectedSkillIds(new Set());
    setBulkCategory('');
    setBulkParentId('');
  };

  if (deletingSkillId) {
    const skillToDelete = skills.find(s => s.id === deletingSkillId);
    if (!skillToDelete) return null;

    const linkedFlashcards = flashcards.filter(f => f.topic === skillToDelete.name).length;
    const linkedXP = skillToDelete.xp;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Delete Subject: {skillToDelete.name}</h2>
          </div>

          <p className="text-zinc-300 mb-6">
            This subject has <strong className="text-white">{linkedFlashcards} flashcards</strong> and <strong className="text-white">{linkedXP} XP</strong> linked to it. Are you sure you want to delete it?
          </p>

          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
              <input 
                type="radio" 
                name="deleteOption" 
                value="unlink"
                checked={deleteOption === 'unlink'}
                onChange={() => setDeleteOption('unlink')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">Keep study data but unlink subject</div>
                <div className="text-sm text-zinc-500">Subject is deleted, but flashcards and progress remain (uncategorized).</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
              <input 
                type="radio" 
                name="deleteOption" 
                value="delete-all"
                checked={deleteOption === 'delete-all'}
                onChange={() => setDeleteOption('delete-all')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">Delete everything</div>
                <div className="text-sm text-zinc-500">Remove the subject, all associated XP, and linked flashcards.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
              <input 
                type="radio" 
                name="deleteOption" 
                value="merge"
                checked={deleteOption === 'merge'}
                onChange={() => setDeleteOption('merge')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-white">Merge with another subject</div>
                <div className="text-sm text-zinc-500 mb-3">Transfer all XP and flashcards to a new subject.</div>
                {deleteOption === 'merge' && (
                  <select 
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select target subject...</option>
                    {activeSkills.filter(s => s.id !== deletingSkillId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-auto">
            <button 
              onClick={() => setDeletingSkillId(null)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={deleteOption === 'merge' && !mergeTargetId}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {editingSkillId ? (
              <>
                <button onClick={() => setEditingSkillId(null)} className="text-zinc-400 hover:text-white mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                Edit Subject
              </>
            ) : 'Manage Subjects'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!editingSkillId && !isBulkGrouping && (
          <div className="flex border-b border-zinc-800 px-6 justify-between items-center">
            <div className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'active' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Active Subjects
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'deleted' ? 'border-red-500 text-red-400' : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Recently Deleted
              </button>
            </div>
            {activeTab === 'active' && selectedSkillIds.size > 0 && (
              <button
                onClick={() => setIsBulkGrouping(true)}
                className="text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Group Selected ({selectedSkillIds.size})
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {editingSkillId ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subject Name</label>
                <input 
                  value={editForm.name || ''}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
                <textarea 
                  value={editForm.description || ''}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category</label>
                  <input 
                    value={editForm.category || ''}
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Parent Subject</label>
                  <select 
                    value={editForm.parentId || ''}
                    onChange={e => setEditForm({...editForm, parentId: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Top Level)</option>
                    {activeSkills.filter(s => s.id !== editingSkillId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Difficulty Level (1-10)</label>
                  <input 
                    type="number"
                    min="1" max="10"
                    value={editForm.difficulty || 1}
                    onChange={e => setEditForm({...editForm, difficulty: parseInt(e.target.value) || 1})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Mastery Goal (Level)</label>
                  <input 
                    type="number"
                    min="1"
                    value={editForm.masteryGoal || 10}
                    onChange={e => setEditForm({...editForm, masteryGoal: parseInt(e.target.value) || 10})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveEdit}
                  disabled={!editForm.name?.trim()}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : isBulkGrouping ? (
            <div className="space-y-5">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white">Group {selectedSkillIds.size} Subjects</h3>
                <p className="text-sm text-zinc-400">Assign a category or parent subject to all selected subjects.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category Name</label>
                <input 
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Or assign to Parent Subject</label>
                <select 
                  value={bulkParentId}
                  onChange={e => setBulkParentId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None</option>
                  {activeSkills.filter(s => !selectedSkillIds.has(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setIsBulkGrouping(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkGroup}
                  disabled={!bulkCategory.trim() && !bulkParentId}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Apply to Selected
                </button>
              </div>
            </div>
          ) : activeTab === 'active' ? (
            <div className="space-y-3">
              {activeSkills.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No active subjects found.</p>
              ) : (
                activeSkills.map(skill => (
                  <div key={skill.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox"
                        checked={selectedSkillIds.has(skill.id)}
                        onChange={() => toggleSkillSelection(skill.id)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {skill.name}
                          {skill.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                              {skill.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-500 mt-1">
                          Level {skill.level} • {skill.xp} XP
                          {skill.parentId && (
                            <span className="ml-2">
                              ↳ Child of {skills.find(s => s.id === skill.parentId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditClick(skill)}
                        className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(skill)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {deletedSkills.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No recently deleted subjects.</p>
              ) : (
                deletedSkills.map(skill => {
                  const daysLeft = 30 - Math.floor((Date.now() - (skill.deletedAt || 0)) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={skill.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 opacity-75">
                      <div>
                        <div className="font-medium text-white line-through">{skill.name}</div>
                        <div className="text-sm text-zinc-500 mt-1">
                          {daysLeft > 0 ? `${daysLeft} days left until permanent deletion` : 'Pending permanent deletion'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => recoverSkill(skill.id)}
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Recover Subject"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => permanentlyDeleteSkill(skill.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
