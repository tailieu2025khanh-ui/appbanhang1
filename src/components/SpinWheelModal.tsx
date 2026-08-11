import React, { useState, useRef, useEffect } from 'react';
import { Gift, X, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Prize {
  id: number;
  label: string;
  type: 'discount_pct' | 'discount_fixed' | 'gift' | 'none';
  value: number;
  color: string;
  textColor: string;
}

const PRIZES: Prize[] = [
  { id: 1, label: 'Giảm 5% Đơn Hàng', type: 'discount_pct', value: 5, color: '#f59e0b', textColor: '#1c1917' },
  { id: 2, label: 'Tặng 1 Trà Tắc', type: 'gift', value: 15000, color: '#10b981', textColor: '#ffffff' },
  { id: 3, label: 'Giảm 10.000 đ', type: 'discount_fixed', value: 10000, color: '#3b82f6', textColor: '#ffffff' },
  { id: 4, label: 'Tặng Extra Bánh Tráng', type: 'gift', value: 5000, color: '#ec4899', textColor: '#ffffff' },
  { id: 5, label: 'Chúc May Mắn', type: 'none', value: 0, color: '#6b7280', textColor: '#ffffff' },
  { id: 6, label: 'Giảm 10% Đơn Hàng', type: 'discount_pct', value: 10, color: '#ef4444', textColor: '#ffffff' },
];

interface SpinWheelModalProps {
  orderSubtotal: number;
  onApplyPrize: (prize: Prize) => void;
  onClose: () => void;
}

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  orderSubtotal,
  onApplyPrize,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation]);

  const drawWheel = (deg: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    const numSlices = PRIZES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const radRotation = (deg * Math.PI) / 180;

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const prize = PRIZES[i];
      const startAngle = i * sliceAngle + radRotation;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1c1917';
      ctx.stroke();

      // Draw Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = prize.textColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(prize.label, radius - 15, 4);
      ctx.restore();
    }

    // Draw Center Peg
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#1c1917';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌽', centerX, centerY);
  };

  const handleSpin = () => {
    if (spinning || wonPrize) return;
    setSpinning(true);

    const selectedIdx = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[selectedIdx];

    const sliceDeg = 360 / PRIZES.length;
    // Calculate final angle to align slice with top pointer (270 degrees or top)
    const targetDeg = 360 * 5 + (360 - selectedIdx * sliceDeg - sliceDeg / 2) - 90;

    let startDeg = rotation;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      if (elapsed < duration) {
        // Easing out cubic
        const progress = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentDeg = startDeg + (targetDeg - startDeg) * easeOut;
        setRotation(currentDeg % 360);
        requestAnimationFrame(animate);
      } else {
        setRotation(targetDeg % 360);
        setSpinning(false);
        setWonPrize(prize);
        if (prize.type !== 'none') {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 border-2 border-stone-900 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="font-black text-stone-900 text-xl flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" /> Vòng Quay May Mắn CHẢ GIÒ BẮP
          </h3>
          <p className="text-xs text-stone-500">Quay thưởng tri ân khách hàng - Nhận quà trực tiếp vào hóa đơn!</p>
        </div>

        {/* Wheel Container with Top Pointer */}
        <div className="relative w-64 h-64 mx-auto my-2">
          {/* Top Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md" />

          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            className="w-full h-full rounded-full shadow-lg border-4 border-stone-900"
          />
        </div>

        {/* Action Button & Result Display */}
        {!wonPrize ? (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{spinning ? 'Đang Quay...' : 'QUAY THƯỞNG NGAY!'}</span>
          </button>
        ) : (
          <div className="space-y-4 bg-amber-50 p-4 rounded-2xl border border-amber-200 animate-in fade-in-50">
            <div className="flex items-center justify-center gap-2 text-amber-900 font-extrabold text-lg">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span>{wonPrize.type === 'none' ? 'Chúc Bạn May Mắn Lần Sau!' : 'Chúc Mừng Bạn Đã Trúng Phần Quà!'}</span>
            </div>

            <p className="font-black text-xl text-[#FF6B35] bg-white p-2.5 rounded-xl border border-amber-300 shadow-xs">
              {wonPrize.label}
            </p>

            <div className="flex gap-2 pt-1">
              {wonPrize.type !== 'none' && (
                <button
                  onClick={() => {
                    onApplyPrize(wonPrize);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" /> Áp Dụng Vào Đơn Hàng
                </button>
              )}
              <button
                onClick={onClose}
                className="py-3 px-4 bg-stone-900 text-amber-400 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
