import React, { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { apiFetch } from './api.ts';

export function ContactPage() {
  const { t, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      showToast('Message sent to KaamConnect support.', 'success');
    } catch (err: any) {
      setError(err.message || t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 font-display">{t.common.contactUs}</h1>
        <p className="text-base text-slate-600 mt-2">{t.home.contactSectionDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Regional Support Desk</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Jayanagar 4th Block, Bengaluru, Karnataka 560011
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Support Email</h2>
              <p className="text-sm text-slate-600 mt-0.5 font-mono-tabular">
                support@kaamconnect.in
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Support Hours</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Monday – Saturday, 9:00 AM to 6:30 PM IST
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Message Received</h2>
              <p className="text-sm text-slate-600">
                Thank you for reaching out. Our support team will review your inquiry shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 text-sm font-semibold text-blue-900 bg-blue-50 rounded-lg"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.auth.fullName} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.auth.email} *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.auth.mobile}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg disabled:opacity-60"
              >
                {submitting ? t.common.loading : t.common.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
