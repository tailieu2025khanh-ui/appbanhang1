import React, { useState, useEffect } from 'react';
import { GraduationCap, X, Award, CheckCircle2, XCircle, RotateCcw, Trophy, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, StoreConfig } from '../types';
import { formatVND } from '../utils/printer';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface MenuQuizModalProps {
  menuItems: MenuItem[];
  config: StoreConfig;
  onClose: () => void;
}

export const MenuQuizModal: React.FC<MenuQuizModalProps> = ({
  menuItems,
  config,
  onClose,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(15);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Generate dynamic quiz questions based on current menu & store config
  useEffect(() => {
    generateQuestions();
  }, [menuItems]);

  const generateQuestions = () => {
    if (menuItems.length === 0) return;
    const generated: QuizQuestion[] = [];

    // Question 1: Price test
    const item1 = menuItems[0] || menuItems[Math.floor(Math.random() * menuItems.length)];
    const price1 = item1.price;
    const wrongPrices = [price1 + 5000, Math.max(10000, price1 - 5000), price1 + 10000]
      .map((p) => formatVND(p));
    const correctPriceStr = formatVND(price1);
    const options1 = shuffleArray([correctPriceStr, ...wrongPrices]);

    generated.push({
      id: 1,
      question: `Món "${item1.name}" trong thực đơn có giá niêm yết là bao nhiêu?`,
      options: options1,
      correctAnswer: correctPriceStr,
      explanation: `Giá chuẩn của ${item1.name} là ${correctPriceStr}.`,
    });

    // Question 2: Category test
    const item2 = menuItems.find((m) => m.category === 'nuoc_uong') || menuItems[1];
    const catMap: Record<string, string> = {
      mon_an: 'Món Ăn Đặc Sản',
      nuoc_uong: 'Nước Uống & Giải Khát',
      combo: 'Combo Tiết Kiệm',
      extra: 'Món Ăn Kèm / Extra',
    };
    const correctCatStr = catMap[item2.category] || 'Nước Uống';
    const wrongCats = Object.values(catMap).filter((c) => c !== correctCatStr);
    const options2 = shuffleArray([correctCatStr, ...wrongCats]);

    generated.push({
      id: 2,
      question: `Món "${item2.name}" thuộc phân loại danh mục nào trên máy POS?`,
      options: options2,
      correctAnswer: correctCatStr,
      explanation: `${item2.name} thuộc danh mục ${correctCatStr}.`,
    });

    // Question 3: Sauce / Topping options
    const itemWithOpts = menuItems.find((m) => m.options && m.options.length > 0) || menuItems[0];
    const sauceGroup = itemWithOpts.options?.[0];
    const sauceName = sauceGroup?.choices[0]?.name || 'Mắm nêm Quảng Ngãi';

    generated.push({
      id: 3,
      question: `Nước chấm hoặc tùy chọn đặc trưng nào đi kèm món "${itemWithOpts.name}"?`,
      options: shuffleArray([
        sauceName,
        'Nước tương tỏi ớt Bắc',
        'Sốt xì dầu mù tạt',
        'Sốt bơ tỏi Pháp',
      ]),
      correctAnswer: sauceName,
      explanation: `Món ${itemWithOpts.name} phục vụ chuẩn cùng ${sauceName}.`,
    });

    // Question 4: Wifi password test
    generated.push({
      id: 4,
      question: `Mật khẩu Wi-Fi của quán ${config.storeName} cung cấp cho khách hàng là gì?`,
      options: shuffleArray([
        config.wifiPassword,
        'chagiobap123456',
        '123456789',
        'quangngai2026',
      ]),
      correctAnswer: config.wifiPassword,
      explanation: `Mật khẩu Wi-Fi chuẩn của quán là: ${config.wifiPassword}.`,
    });

    // Question 5: Best seller items
    const bestSeller = menuItems.find((m) => m.isBestSeller) || menuItems[0];
    generated.push({
      id: 5,
      question: `Món nào sau đây được gắn nhãn "Best Seller" bán chạy nhất của cửa hàng?`,
      options: shuffleArray([
        bestSeller.name,
        'Cơm chiên hải sản',
        'Bún chả Hà Nội',
        'Lẩu thái chua cay',
      ]),
      correctAnswer: bestSeller.name,
      explanation: `${bestSeller.name} là món ăn Best Seller bán chạy hàng đầu!`,
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setTimer(15);
  };

  function shuffleArray<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  // Timer Countdown Effect
  useEffect(() => {
    if (isFinished || isAnswered || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, isAnswered, isFinished, questions]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(null);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore((prev) => prev + 20);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(15);
    } else {
      setIsFinished(true);
      if (score >= 60) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      }
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 border-2 border-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-lg flex items-center gap-2">
                <span>Trắc Nghiệm Đào Tạo Nhân Viên</span>
                <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  {config.storeName}
                </span>
              </h3>
              <p className="text-xs text-stone-500">Ôn tập kiến thức thực đơn & dịch vụ khách hàng</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished && currentQ ? (
          <div className="space-y-5">
            {/* Progress & Timer */}
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <span>
                Câu hỏi <span className="text-amber-600 text-sm font-black">{currentIndex + 1}</span> / {questions.length}
              </span>

              <div className="flex items-center gap-1.5 text-stone-800 font-mono">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Thời gian: <strong className={timer <= 5 ? 'text-rose-600 animate-pulse' : 'text-stone-900'}>{timer}s</strong></span>
              </div>

              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-black">
                Điểm: {score} đ
              </span>
            </div>

            {/* Question Text */}
            <div className="p-4 bg-stone-900 text-white rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">CÂU HỎI {currentIndex + 1}</span>
              <p className="font-extrabold text-base leading-relaxed">{currentQ.question}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isCorrect = opt === currentQ.correctAnswer;
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-stone-50 hover:bg-stone-100 text-stone-900 border-stone-200';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-md';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-600 text-white border-rose-700';
                  } else {
                    btnStyle = 'bg-stone-100 text-stone-400 border-stone-200 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left font-bold text-xs flex items-center justify-between transition-all active:scale-[0.99] ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-stone-900/10 flex items-center justify-center font-black text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next */}
            {isAnswered && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in-50">
                <p className="text-xs text-amber-950 font-medium">
                  💡 <strong>Giải thích:</strong> {currentQ.explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Câu Tiếp Theo →' : 'Xem Kết Quả Đào Tạo'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* RESULT SUMMARY SCREEN */
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center border-4 border-amber-400 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-2xl text-stone-900">Hoàn Thành Bài Kiểm Tra!</h4>
              <p className="text-xs text-stone-500">Kết quả đánh giá năng lực thực đơn nhân viên</p>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 max-w-sm mx-auto space-y-2">
              <p className="text-xs font-semibold text-stone-500">Tổng điểm đạt được:</p>
              <p className="text-4xl font-black text-amber-600">{score} / 100 đ</p>
              <p className="text-xs font-bold text-stone-800 pt-1">
                Danh hiệu: {score >= 80 ? '⭐ Nhân Viên Ưu Tú (Master POS)' : score >= 60 ? '👍 Đạt Yêu Cầu Phục Vụ' : '⚠️ Cần Ôn Lại Thực Đơn'}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={generateQuestions}
                className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs rounded-2xl flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Làm Lại Bài Quiz
              </button>

              <button
                onClick={onClose}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl"
              >
                Hoàn Thành
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
