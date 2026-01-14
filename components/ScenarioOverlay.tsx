import React, { useState, useEffect, useRef } from 'react';
import { ScenarioType, TaskStep, ChatMessage } from '../types.ts';
import { Play, Mic, FileText, Users, PenTool, CheckCircle, XCircle, BrainCircuit, Send, Square, RotateCcw } from 'lucide-react';

interface Props {
  step: TaskStep;
  onNext: () => void;
  canAdvance: boolean;
  onQuizComplete?: (score: number) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRecordingComplete: (url: string) => void; // New prop
}

export const ScenarioOverlay: React.FC<Props> = ({ step, onNext, canAdvance, onQuizComplete, messages, onSendMessage, onRecordingComplete }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Reset quiz state when step changes
  useEffect(() => {
    if (step.scenario === ScenarioType.QUIZ && step.quizData) {
      setSelectedAnswers(new Array(step.quizData.length).fill(-1));
      setQuizSubmitted(false);
      setQuizPassed(false);
    }
    // Cleanup recording if step changes
    stopRecordingCleanup();
    setAudioUrl(null);
    setRecordingTime(0);
  }, [step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopRecordingCleanup();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, step.scenario]);

  // Recording Functions
  const stopRecordingCleanup = () => {
      if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream);
          chunksRef.current = [];

          mediaRecorderRef.current.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          mediaRecorderRef.current.onstop = () => {
              const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
              // Pass url to parent
              onRecordingComplete(url);
              // Stop all tracks to release mic
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorderRef.current.start();
          setIsRecording(true);
          setRecordingTime(0);
          setAudioUrl(null);

          timerRef.current = window.setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (err) {
          console.error("Microphone access denied:", err);
          alert("无法访问麦克风，请检查权限设置。");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted && quizPassed) return; 
    const newAnswers = [...selectedAnswers];
    newAnswers[qIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
    setQuizSubmitted(false); // Allow re-submit if not passed
  };

  const handleSubmitQuiz = () => {
    if (!step.quizData) return;
    
    let correctCount = 0;
    step.quizData.forEach((q, i) => {
        if (selectedAnswers[i] === q.correctIndex) correctCount++;
    });

    const score = Math.round((correctCount / step.quizData.length) * 100);
    setQuizSubmitted(true);
    
    if (score === 100) {
        setQuizPassed(true);
        if (onQuizComplete) onQuizComplete(score);
    } else {
        setQuizPassed(false);
    }
  };

  const handleSend = () => {
      if (chatInput.trim()) {
          onSendMessage(chatInput);
          setChatInput("");
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSend();
      }
  };

  // Override canAdvance for QUIZ type
  const isQuizMode = step.scenario === ScenarioType.QUIZ;
  const enableNext = isQuizMode ? quizPassed : canAdvance;

  const renderContent = () => {
    switch (step.scenario) {
      case ScenarioType.QUIZ:
        return (
            <div className="bg-slate-50 text-slate-900 p-8 rounded-xl shadow-lg h-full flex flex-col border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">理论知识考核</h3>
                        <p className="text-sm text-slate-500">请完成以下测试以解锁实操权限</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {step.quizData?.map((q, qIndex) => {
                        const isCorrect = selectedAnswers[qIndex] === q.correctIndex;
                        const showResult = quizSubmitted;
                        
                        return (
                            <div key={q.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-3 flex gap-2">
                                    <span className="text-indigo-600">{qIndex + 1}.</span> {q.question}
                                </h4>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleOptionSelect(qIndex, oIndex)}
                                            disabled={quizPassed}
                                            className={`w-full text-left px-4 py-3 rounded-md text-sm transition-all border
                                                ${selectedAnswers[qIndex] === oIndex 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' 
                                                    : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'}
                                                ${showResult && oIndex === q.correctIndex ? '!bg-emerald-100 !border-emerald-500 !text-emerald-800' : ''}
                                                ${showResult && selectedAnswers[qIndex] === oIndex && oIndex !== q.correctIndex ? '!bg-red-100 !border-red-500 !text-red-800' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{String.fromCharCode(65 + oIndex)}. {opt}</span>
                                                {showResult && oIndex === q.correctIndex && <CheckCircle size={16} className="text-emerald-600" />}
                                                {showResult && selectedAnswers[qIndex] === oIndex && oIndex !== q.correctIndex && <XCircle size={16} className="text-red-600" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                    {!quizPassed ? (
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-slate-500">
                                {quizSubmitted ? "请更正错误选项后重试。" : "需全对通过考核。"}
                            </p>
                            <button 
                                onClick={handleSubmitQuiz}
                                disabled={selectedAnswers.includes(-1)}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-indigo-200"
                            >
                                {quizSubmitted ? "重试" : "提交答案"}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-700 flex items-center gap-2 justify-center font-bold">
                            <CheckCircle size={20} /> 考核通过，解锁下一步
                        </div>
                    )}
                </div>
            </div>
        );

      case ScenarioType.BLACKBOARD:
        return (
          <div className="bg-zinc-800 border-4 border-zinc-700 p-6 rounded-lg shadow-2xl h-full flex flex-col font-serif text-white relative overflow-hidden">
             {/* 粉笔灰纹理效果 */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/black-scales.png)'}}></div>
            <h2 className="text-3xl border-b-2 border-white/20 pb-4 mb-4 font-bold flex items-center">
                <span className="text-yellow-100">{step.title}</span>
            </h2>
            <div className="flex-1 text-xl leading-relaxed text-zinc-100 overflow-y-auto">
              <p className="whitespace-pre-wrap">{step.description}</p>
            </div>
            <div className="text-sm text-zinc-500 font-sans mt-4 text-right">讲师模式：教学演示中</div>
          </div>
        );

      case ScenarioType.WORKBOOK:
        return (
          <div className="bg-slate-100 text-slate-900 p-8 rounded shadow-lg h-full flex flex-col relative" style={{backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '100% 2rem'}}>
            <div className="absolute top-0 right-8 bg-red-600 w-12 h-12 shadow-md flex items-center justify-center rounded-b text-white font-bold text-lg">Q1</div>
            <h3 className="text-2xl font-bold font-mono mb-6 text-slate-800 uppercase tracking-widest">{step.title}</h3>
            <p className="text-lg mb-8 font-serif italic text-slate-700 whitespace-pre-wrap">{step.description}</p>
            
            <div className="bg-white border-2 border-slate-300 p-4 rounded shadow-inner">
              <p className="font-bold mb-2">技术员记录单：</p>
              <textarea 
                className="w-full h-32 p-2 bg-transparent outline-none resize-none font-handwriting text-blue-800"
                placeholder="在此记录螺栓扭矩值、垫片厚度及磨损观察情况..." 
              />
            </div>
          </div>
        );

      case ScenarioType.DISCUSSION:
        return (
          <div className="bg-white text-slate-800 p-6 rounded-xl shadow-lg h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-lg">班组讨论频道</h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2">
                {/* System Message / Description */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-600 italic">
                    <p className="font-bold text-slate-700 mb-1">任务目标：</p>
                    {step.description}
                </div>

                {/* Chat History */}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'STUDENT' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                            ${msg.role === 'EXPERT' ? 'bg-indigo-500' : msg.role === 'TEACHER' ? 'bg-purple-500' : 'bg-emerald-500'}
                        `}>
                            {msg.sender[0]}
                        </div>
                         <div className={`p-3 text-sm max-w-[80%] 
                            ${msg.role === 'STUDENT' 
                                ? 'bg-emerald-50 border border-emerald-100 rounded-l-xl rounded-br-xl' 
                                : 'bg-slate-100 border border-slate-200 rounded-r-xl rounded-bl-xl'}
                         `}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-semibold text-xs ${msg.role === 'STUDENT' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {msg.sender} {msg.role === 'EXPERT' ? '(专家)' : ''}
                                </span>
                                <span className="text-[10px] text-slate-400">{msg.time}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>
            
            <div className="mt-auto flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入你的观察结果..." 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
                <button 
                    onClick={handleSend}
                    disabled={!chatInput.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    发送 <Send size={14} />
                </button>
            </div>
          </div>
        );

      case ScenarioType.PODIUM:
        return (
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6 rounded-xl shadow-2xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
             
             {/* Dynamic Icon based on state */}
             {!isRecording && !audioUrl ? (
                 <button onClick={startRecording} className="mb-6 p-4 bg-pink-500/20 rounded-full hover:bg-pink-500/30 transition-all cursor-pointer">
                    <Mic className="w-16 h-16 text-pink-400" />
                 </button>
             ) : isRecording ? (
                 <div className="mb-6 relative">
                     <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                     <Mic className="w-16 h-16 text-red-500 relative z-10" />
                 </div>
             ) : (
                 <button onClick={() => { setAudioUrl(null); }} className="mb-6 p-4 bg-emerald-500/20 rounded-full hover:bg-emerald-500/30 transition-all cursor-pointer" title="重新录制">
                    <CheckCircle className="w-16 h-16 text-emerald-400" />
                 </button>
             )}
             
             <h2 className="text-3xl font-bold mb-2">费曼学习法讲解</h2>
             <p className="text-indigo-200 mb-8 max-w-md">请像教导新学员一样，口述【{step.title}】的标准作业流程。</p>
             
             {/* Controls */}
             <div className="w-full max-w-sm bg-black/30 rounded-full h-16 flex items-center justify-between px-4 mb-6 backdrop-blur-sm border border-white/10">
                {isRecording ? (
                    <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg shadow-red-500/50">
                        <Square className="w-4 h-4 fill-white text-white" />
                    </button>
                ) : audioUrl ? (
                    <button onClick={startRecording} className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center hover:bg-slate-500 transition-colors text-xs font-bold" title="重录">
                        <RotateCcw className="w-4 h-4 text-white" />
                    </button>
                ) : (
                    <button onClick={startRecording} className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center hover:bg-pink-500 transition-colors shadow-lg shadow-pink-600/50">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </button>
                )}

                <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden relative">
                     {isRecording && <div className="absolute inset-0 bg-green-400/80 w-full animate-pulse"></div>}
                     {audioUrl && <div className="h-full w-full bg-green-500"></div>}
                </div>
                
                <span className="font-mono text-sm text-green-400 w-16 text-right">
                    {formatTime(recordingTime)}
                </span>
             </div>
             
             {audioUrl && (
                 <audio controls src={audioUrl} className="mb-4 h-8 w-full max-w-sm opacity-80" />
             )}

             <p className="text-sm text-purple-300">
                 {isRecording ? "正在录制考核音频..." : audioUrl ? "录制完成，请回听或继续" : "点击麦克风或红色按钮开始录音"}
             </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex-1 relative overflow-hidden">
            {renderContent()}
        </div>
        
        <div className="mt-4 flex justify-end">
            <button 
                onClick={onNext}
                disabled={!enableNext}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                    enableNext 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 translate-y-0' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
                下一步
                <Play className="w-4 h-4 fill-current" />
            </button>
        </div>
    </div>
  );
};