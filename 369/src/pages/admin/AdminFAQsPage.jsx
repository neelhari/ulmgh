import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function AdminFAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    question_en: '', question_te: '', answer_en: '', answer_te: '',
    status: 'active', sort_order: 0
  });

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/faqs/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch (e) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleEdit = (faq) => {
    setForm({
      question_en: faq.question_en, question_te: faq.question_te || '',
      answer_en: faq.answer_en, answer_te: faq.answer_te || '',
      status: faq.status, sort_order: faq.sort_order
    });
    setEditingId(faq.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question_en || !form.answer_en) return toast.error('English Question and Answer are required');
    try {
      const url = editingId ? `${BACKEND_URL}/faqs/${editingId}` : `${BACKEND_URL}/faqs`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success(editingId ? 'FAQ updated' : 'FAQ created');
        setIsModalOpen(false);
        fetchFaqs();
      } else {
        toast.error('Save failed');
      }
    } catch (e) {
      toast.error('Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await fetch(`${BACKEND_URL}/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or remove frequently asked questions for the support page.</p>
        </div>
        <button onClick={() => { setForm({ question_en: '', question_te: '', answer_en: '', answer_te: '', status: 'active', sort_order: 0 }); setEditingId(null); setIsModalOpen(true); }} className="bg-[#fe6603] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#e55c03] transition-colors">
          <Plus className="w-5 h-5" /> Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold">Order</th>
              <th className="p-4 font-semibold">Question (English)</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center p-8 text-gray-500">Loading...</td></tr>
            ) : faqs.length === 0 ? (
              <tr><td colSpan="4" className="text-center p-8 text-gray-500">No FAQs found.</td></tr>
            ) : (
              faqs.map(f => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-600">{f.sort_order}</td>
                  <td className="p-4 text-sm text-gray-900 font-medium truncate max-w-md">{f.question_en}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(f)} className="p-2 text-gray-400 hover:text-[#036e26] transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question (English) *</label>
                  <input type="text" value={form.question_en} onChange={e => setForm({...form, question_en: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question (Telugu)</label>
                  <input type="text" value={form.question_te} onChange={e => setForm({...form, question_te: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer (English) *</label>
                  <textarea rows="4" value={form.answer_en} onChange={e => setForm({...form, answer_en: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer (Telugu)</label>
                  <textarea rows="4" value={form.answer_te} onChange={e => setForm({...form, answer_te: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm resize-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} className="bg-[#fe6603] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#e55c03] transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" /> Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
