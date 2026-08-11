import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface PINModalProps {
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose: () => void;
  correctPin?: string;
}

export const PINModal: React.FC<PINModalProps> = ({
  title = 'Xác Thực Mã PIN Quản Lý',
  description = 'Vui lòng nhập mã PIN quản lý để truy cập tính năng này (Mặc định: 1234)',
  onSuccess,
  onClose,
  correctPin = '1234',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 border-2 border-stone-900">
        <div className="flex items-center justify-between border-b pb-3 border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-500 text-center">{description}</p>

        {/* PIN Display Dots */}
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  error
                    ? 'border-rose-500 bg-rose-500 animate-bounce'
                    : filled
                    ? 'border-amber-500 bg-amber-500 scale-110'
                    : 'border-stone-300 bg-stone-100'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-bold text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Mã PIN không chính xác! Thử lại.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="py-3 bg-stone-100 hover:bg-amber-100 text-stone-900 font-black text-lg rounded-2xl transition-all active:scale-95 border border-stone-200"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClose}
            className="py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-2xl"
          >
            Hủy
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-3 bg-stone-100 hover:bg-amber-100 text-stone-900 font-black text-lg rounded-2xl border border-stone-200"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-2xl"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};
