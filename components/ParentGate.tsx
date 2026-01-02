
import React, { useState, useEffect } from 'react';
import { ParentConfig } from '../types';

// SHA-256 hash function using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ParentGateProps {
  parentConfig: ParentConfig;
  onConfigUpdate: (config: ParentConfig) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

const ParentGate: React.FC<ParentGateProps> = ({
  parentConfig,
  onConfigUpdate,
  onSuccess,
  onCancel
}) => {
  const [input, setInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [isSettingUp, setIsSettingUp] = useState(!parentConfig.isSetup);

  // Check and update lockout timer
  useEffect(() => {
    const checkLock = () => {
      if (parentConfig.lockUntil > Date.now()) {
        setLockRemaining(Math.ceil((parentConfig.lockUntil - Date.now()) / 1000));
      } else {
        setLockRemaining(0);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [parentConfig.lockUntil]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }

    if (input !== confirmInput) {
      setError(true);
      setConfirmInput('');
      setTimeout(() => setError(false), 1000);
      return;
    }

    const pinHash = await hashPin(input);
    onConfigUpdate({
      ...parentConfig,
      pinHash,
      isSetup: true,
      failedAttempts: 0,
      lockUntil: 0
    });
    onSuccess();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (parentConfig.lockUntil > Date.now()) {
      return;
    }

    const inputHash = await hashPin(input);

    if (inputHash === parentConfig.pinHash) {
      // Success - reset failed attempts
      onConfigUpdate({
        ...parentConfig,
        failedAttempts: 0,
        lockUntil: 0
      });
      onSuccess();
    } else {
      // Failed attempt
      const newAttempts = parentConfig.failedAttempts + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      onConfigUpdate({
        ...parentConfig,
        failedAttempts: shouldLock ? 0 : newAttempts,
        lockUntil: shouldLock ? Date.now() + LOCKOUT_DURATION_MS : parentConfig.lockUntil
      });

      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const isLocked = lockRemaining > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-indigo-900/80 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border-8 border-white text-center space-y-8 animate-pop-in">
        <div className="text-6xl">{isSettingUp ? '🔐' : '🔒'}</div>
        <h2 className="text-3xl font-black text-indigo-900">
          {isSettingUp ? 'إعداد رمز الوالدين' : 'منطقة الكبار فقط'}
        </h2>
        <p className="text-slate-500 font-bold">
          {isSettingUp
            ? 'اختر رمز مرور من 4 أرقام'
            : isLocked
              ? `محاولات كثيرة! انتظر ${lockRemaining} ثانية`
              : 'أدخل رقم المرور للمتابعة'}
        </p>

        {isLocked ? (
          <div className="py-8">
            <div className="w-20 h-20 mx-auto border-8 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-rose-500 font-black text-xl">{lockRemaining} ثانية</p>
          </div>
        ) : isSettingUp ? (
          <form onSubmit={handleSetupSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
                className={`w-full text-center text-4xl tracking-widest p-4 rounded-2xl bg-slate-100 border-4 focus:outline-none transition-all ${error ? 'border-rose-400 animate-shake' : 'border-slate-200 focus:border-indigo-400'}`}
                placeholder="رمز جديد"
                autoFocus
              />
              <input
                type="password"
                maxLength={4}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value.replace(/\D/g, ''))}
                className={`w-full text-center text-4xl tracking-widest p-4 rounded-2xl bg-slate-100 border-4 focus:outline-none transition-all ${error && input !== confirmInput ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-400'}`}
                placeholder="تأكيد الرمز"
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black">إلغاء</button>
              <button
                type="submit"
                disabled={input.length < 4 || confirmInput.length < 4}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <input
              type="password"
              maxLength={4}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
              className={`w-full text-center text-4xl tracking-widest p-4 rounded-2xl bg-slate-100 border-4 focus:outline-none transition-all ${error ? 'border-rose-400 animate-shake' : 'border-slate-200 focus:border-indigo-400'}`}
              placeholder="****"
              autoFocus
            />
            {parentConfig.failedAttempts > 0 && (
              <p className="text-rose-500 font-bold text-sm">
                محاولات متبقية: {MAX_ATTEMPTS - parentConfig.failedAttempts}
              </p>
            )}
            <div className="flex gap-4">
              <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black">إلغاء</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">دخول</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ParentGate;
