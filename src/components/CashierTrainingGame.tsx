import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Zap,
  ShoppingBag,
  Award,
  X,
  Volume2,
} from 'lucide-react';
import { MenuItem } from '../types/pos';

interface CashierTrainingGameProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

interface TargetOrderRequirement {
  item: MenuItem;
  quantity: number;
}

interface OrderChallenge {
  id: number;
  customerName: string;
  avatar: string;
  dialogue: string;
  requirements: TargetOrderRequirement[];
  givenMoney: number;
}

export const CashierTrainingGame: React.FC<CashierTrainingGameProps> = ({
  isOpen,
  onClose,
  menuItems,
}) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<OrderChallenge | null>(null);

  // Selected cart items in game
  const [selectedItems, setSelectedItems] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [enteredMoney, setEnteredMoney] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // High score persistence
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('fnb_game_highscore') || '0', 10);
    } catch (e) {
      return 0;
    }
  });

  // Generate random order challenge
  const generateChallenge = (id: number): OrderChallenge => {
    const customers = [
      { name: 'Anh Hùng (Khách quen)', avatar: '👨‍💼' },
      { name: 'Chị Lan (Công sở)', avatar: '👩‍💼' },
      { name: 'Chú Ba (Chạy Grab)', avatar: '🛵' },
      { name: 'Bạn Linh (Học sinh)', avatar: '🎒' },
    ];
    const cust = customers[Math.floor(Math.random() * customers.length)];

    // Pick 1 to 3 random menu items
    const numItems = Math.floor(Math.random() * 2) + 1;
    const reqs: TargetOrderRequirement[] = [];

    const availableItems = menuItems.length > 0 ? menuItems : [];
    for (let i = 0; i < numItems; i++) {
      const randItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      if (!reqs.some((r) => r.item.id === randItem.id)) {
        reqs.push({ item: randItem, quantity: qty });
      }
    }

    const totalCost = reqs.reduce((sum, r) => sum + r.item.price * r.quantity, 0);

    // Pick given money (rounded up to nearest 50k / 100k or exact)
    const moneyOptions = [totalCost, Math.ceil(totalCost / 50000) * 50000, Math.ceil(totalCost / 100000) * 100000];
    const givenMoney = moneyOptions[Math.floor(Math.random() * moneyOptions.length)] || totalCost;

    const itemsText = reqs.map((r) => `${r.quantity} phần ${r.item.name}`).join(', ');
    const dialogue = `Chào em! Cho anh/chị lấy: ${itemsText}. Đưa em ${givenMoney.toLocaleString('vi-VN')}đ nhé!`;

    return {
      id,
      customerName: cust.name,
      avatar: cust.avatar,
      dialogue,
      requirements: reqs,
      givenMoney,
    };
  };

  // Timer countdown hook
  useEffect(() => {
    let timer: any = null;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('ended');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Update high score on game end
  useEffect(() => {
    if (gameState === 'ended') {
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem('fnb_game_highscore', score.toString());
        } catch (e) {}
      }
    }
  }, [gameState, score, highScore]);

  if (!isOpen) return null;

  const handleStartGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setCompletedOrders(0);
    setSelectedItems([]);
    setEnteredMoney(0);
    setFeedback(null);
    setCurrentChallenge(generateChallenge(1));
  };

  const handleAddItemToCart = (item: MenuItem) => {
    if (gameState !== 'playing') return;
    setSelectedItems((prev) => {
      const idx = prev.findIndex((p) => p.menuItem.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleSubmitOrder = () => {
    if (!currentChallenge || gameState !== 'playing') return;

    // Check accuracy of items
    let isCorrect = true;

    // Must match exact item counts
    if (selectedItems.length !== currentChallenge.requirements.length) {
      isCorrect = false;
    } else {
      for (const req of currentChallenge.requirements) {
        const found = selectedItems.find((s) => s.menuItem.id === req.item.id);
        if (!found || found.quantity !== req.quantity) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      const addedPoints = 100 + streak * 20;
      setScore((prev) => prev + addedPoints);
      setStreak((prev) => prev + 1);
      setCompletedOrders((prev) => prev + 1);
      setFeedback({ type: 'success', msg: `Chính xác! +${addedPoints} điểm 🔥` });

      // Next challenge
      setTimeout(() => {
        setSelectedItems([]);
        setEnteredMoney(0);
        setFeedback(null);
        setCurrentChallenge(generateChallenge(completedOrders + 2));
      }, 700);
    } else {
      setStreak(0);
      setFeedback({ type: 'error', msg: 'Chưa đúng yêu cầu món ăn của khách! Thử lại nhanh nào!' });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A1A1A] text-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-amber-500/30 flex flex-col h-[85vh] animate-fadeIn">
        {/* Top Header */}
        <div className="bg-[#2C2C24] p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-wide flex items-center gap-2 text-amber-400">
                THỬ THÁCH TỐC ĐỘ THU NGÂN POS
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Game luyện tập phản xạ order & thuộc giá món BÁN HÀNG CHẢ GIÒ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Stats Bar */}
        <div className="bg-[#111111] p-3 px-5 border-b border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`} />
            <span className="text-gray-400">Thời gian:</span>
            <span className={`font-black text-sm ${timeLeft <= 10 ? 'text-rose-500' : 'text-amber-400'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400">Streak:</span>
              <span className="text-amber-400 font-extrabold">{streak}x</span>
            </div>

            <div className="flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">Điểm:</span>
              <span className="text-emerald-400 font-extrabold text-sm">{score}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-400 font-medium">
              <Award className="w-4 h-4 text-sky-400" />
              <span>Kỷ lục:</span>
              <span className="text-sky-400 font-bold">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Main Game Screen */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#141414]">
          {gameState === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-6">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-4xl border border-amber-500/30">
                🎯
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-extrabold text-lg text-white">Sẵn Sàng Thử Thách 60 Giây?</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Khách hàng sẽ liên tục vào gọi các suất chả giò & đồ uống ngẫu nhiên. Nhiệm vụ của bạn là click chọn đúng món trong menu bên dưới để xuất đơn nhanh nhất!
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>BẮT ĐẦU CHƠI NGAY</span>
              </button>
            </div>
          )}

          {gameState === 'playing' && currentChallenge && (
            <div className="space-y-4">
              {/* Customer Prompt Box */}
              <div className="bg-[#22221E] border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-md animate-fadeIn">
                <div className="text-3xl bg-[#1A1A1A] p-2 rounded-2xl border border-gray-700">
                  {currentChallenge.avatar}
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                    {currentChallenge.customerName} đang gọi món:
                  </span>
                  <p className="text-sm font-extrabold text-white leading-snug">
                    "{currentChallenge.dialogue}"
                  </p>
                </div>
              </div>

              {/* Feedback alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn ${
                    feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{feedback.msg}</span>
                </div>
              )}

              {/* Cashier Menu Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400">Bấm chọn món đúng yêu cầu của khách:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddItemToCart(item)}
                      className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#333333] border border-gray-700 text-left transition-all flex flex-col justify-between h-20 active:scale-95"
                    >
                      <span className="font-bold text-xs text-gray-100 line-clamp-1">{item.name}</span>
                      <span className="font-extrabold text-xs text-amber-400">
                        {item.price.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Cart In Game */}
              <div className="bg-[#1D1D1D] p-3 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" /> Giỏ Hàng Đã Bấm Chọn:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className="text-[10.5px] text-gray-400 hover:text-rose-400 underline font-medium"
                  >
                    Xóa chọn lại
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedItems.length === 0 ? (
                    <span className="text-gray-500 italic text-[11px]">Chưa chọn món nào...</span>
                  ) : (
                    selectedItems.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-[#333] text-amber-300 font-bold border border-gray-700">
                        {s.menuItem.name} x{s.quantity}
                      </span>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN XUẤT ĐƠN HÀNG</span>
                </button>
              </div>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-6 animate-fadeIn">
              <div className="text-5xl">🏆</div>
              <div className="space-y-1">
                <h3 className="font-black text-xl text-amber-400">HẾT GIỜ RỒI!</h3>
                <p className="text-xs text-gray-300">
                  Bạn đã hoàn thành <span className="font-bold text-white">{completedOrders}</span> đơn hàng!
                </p>
              </div>

              <div className="bg-[#252525] p-4 rounded-2xl border border-gray-700 w-full max-w-xs space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tổng điểm số:</span>
                  <span className="font-black text-amber-400 text-base">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Kỷ lục cao nhất:</span>
                  <span className="font-bold text-sky-400">{highScore}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartGame}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CHƠI LẠI LẦN NỮA</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
