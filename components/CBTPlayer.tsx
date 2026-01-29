
import React, { useState, useEffect, useCallback } from 'react';
import { Question, TestAttempt } from '../types';
import { formatTime } from '../utils';

interface CBTPlayerProps {
  questions: Question[];
  onFinish: (attempt: Partial<TestAttempt>) => void;
  timeLimit: number; // in minutes
}

export const CBTPlayer: React.FC<CBTPlayerProps> = ({ questions, onFinish, timeLimit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [isFinished, setIsFinished] = useState(false);

  const handleSubmit = useCallback(() => {
    if (isFinished) return;
    setIsFinished(true);
    
    let score = 0;
    userAnswers.forEach((ans, idx) => {
      if (ans === questions[idx].correctIndex) score++;
    });

    onFinish({
      questionCount: questions.length,
      questions,
      userAnswers,
      score,
      totalMarks: questions.length,
      timeAllowed: timeLimit,
      timeSpent: (timeLimit * 60) - timeLeft,
    });
  }, [isFinished, userAnswers, questions, timeLimit, timeLeft, onFinish]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const handleSelect = (optionIdx: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIdx] = optionIdx;
    setUserAnswers(newAnswers);
  };

  const q = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500">Question</span>
          <span className="text-xl font-bold text-slate-800">{currentIdx + 1} / {questions.length}</span>
        </div>
        
        <div className={`flex flex-col items-end ${timeLeft < 60 ? 'text-red-600' : 'text-slate-800'}`}>
          <span className="text-sm font-medium text-slate-500">Time Remaining</span>
          <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-300" 
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
        <h3 className="text-xl font-semibold text-slate-800 mb-8 leading-relaxed">
          {q.question}
        </h3>

        <div className="space-y-4 flex-grow">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                userAnswers[currentIdx] === idx 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${
                userAnswers[currentIdx] === idx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="text-lg">{option}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-12 pt-8 border-t border-slate-100">
          <button
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-6 py-2 font-medium text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>
          
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              Submit Final Answers
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
