import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard.tsx';
import { ThreeScene } from './components/ThreeScene.tsx';
import { ScenarioOverlay } from './components/ScenarioOverlay.tsx';
import { TeacherStats } from './components/TeacherStats.tsx';
import { ToolType, ScenarioType, StudentStats, UserMode, ModelType, ChatMessage } from './types.ts';
import { COURSES } from './constants.ts';
import { AppLogo } from './components/AppLogo.tsx';
import { Lightbulb, Settings, Wrench, Hand, Hammer, RefreshCcw, Eye, Monitor, Layers, ArrowLeft, Anchor, ExternalLink, Box, Server, Cpu } from 'lucide-react';

type ViewState = 'SELECTION' | 'DASHBOARD' | 'SIMULATION';

export default function App() {
  const [view, setView] = useState<ViewState>('SELECTION');
  const [mode, setMode] = useState<UserMode>('STUDENT');
  const [selectedModule, setSelectedModule] = useState<ModelType>('REDUCER');
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [removedParts, setRemovedParts] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.NONE);
  const [showAIHint, setShowAIHint] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  
  // Load Course Data
  const activeCourse = COURSES[selectedModule];
  const currentStep = activeCourse.curriculum[currentStepIndex];
  
  // Stats State
  const [stats, setStats] = useState<StudentStats>({
    timeSpent: 0,
    errors: 0,
    completedTasks: 0,
    accuracy: 100,
    quizScore: 0
  });

  // Get initial expert message based on module
  const getInitialMessage = (mod: ModelType): ChatMessage => {
      if (mod === 'REDUCER') {
          return { id: 'init-1', sender: '李工', role: 'EXPERT', text: '拆卸箱盖时注意观察定位销的位置，不要强行撬击结合面，容易损伤密封性。', time: '10:30' };
      } else {
          return { id: 'init-1', sender: '李工', role: 'EXPERT', text: '航空发动机拆装必须严格遵守“三清”原则。拆卸风扇机匣前，请务必确认管路已完全断开。', time: '10:30' };
      }
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([getInitialMessage('REDUCER')]);

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: '我',
        role: 'STUDENT',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, newMsg]);
  };

  // Calculate Progress
  const progressPercent = Math.round(((currentStepIndex + 1) / activeCourse.curriculum.length) * 100);

  // Timer
  useEffect(() => {
    let interval: any;
    if (view === 'SIMULATION') {
      interval = setInterval(() => {
        setStats(prev => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  // Handle Module Selection
  const handleSelectModule = (moduleId: ModelType) => {
      setSelectedModule(moduleId);
      setView('DASHBOARD');
      // Reset state
      setCurrentStepIndex(0);
      setRemovedParts([]);
      setActiveTool(ToolType.NONE);
      setIsAnnotationMode(false);
      setShowAIHint(false);
      setStats({ timeSpent: 0, errors: 0, completedTasks: 0, accuracy: 100, quizScore: 0 });
      // Update chat context
      setChatHistory([getInitialMessage(moduleId)]);
  };

  const handleStart = (selectedMode: UserMode) => {
    setMode(selectedMode);
    setView('SIMULATION');
  };

  const handlePartInteract = (partId: string) => {
    if (isAnnotationMode) return;
    
    // In INSPECT mode, interaction is just for viewing, no state change needed here
    if (currentStep.actionType === 'INSPECT') return;

    if (currentStep.actionType === 'DISASSEMBLE') {
      if (!removedParts.includes(partId)) {
        setRemovedParts(prev => [...prev, partId]);
      }
    } else {
      if (removedParts.includes(partId)) {
        setRemovedParts(prev => prev.filter(id => id !== partId));
      }
    }
  };

  const handleWrongTool = () => {
    setStats(prev => ({ 
      ...prev, 
      errors: prev.errors + 1,
      accuracy: Math.max(0, 100 - ((prev.errors + 1) * 5))
    }));
    alert(`工具选择错误！\n当前任务：${currentStep.title}\n请查看任务说明选择正确工具。`);
  };

  const handleQuizComplete = (score: number) => {
    setStats(prev => ({
        ...prev,
        quizScore: score,
        // Update general accuracy by averaging task accuracy and quiz score for a "Total Score"
        // But let's just keep them separate for clearer teacher stats
    }));
  };

  const handleRecordingComplete = (url: string) => {
      setStats(prev => ({
          ...prev,
          recentRecordingUrl: url
      }));
  };

  const canAdvance = () => {
    // For Quiz, ScenarioOverlay handles the check.
    if (currentStep.scenario === ScenarioType.QUIZ) return true; 
    
    // For Inspection/Knowledge steps, always allow advance
    if (currentStep.actionType === 'INSPECT') return true;

    if (currentStep.targetPartIds.length === 0) return true;
    
    if (currentStep.actionType === 'DISASSEMBLE') {
      return currentStep.targetPartIds.every(id => removedParts.includes(id));
    } else {
      return currentStep.targetPartIds.every(id => !removedParts.includes(id));
    }
  };

  const nextStep = () => {
    if (currentStepIndex < activeCourse.curriculum.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setActiveTool(ToolType.NONE);
    } else {
      alert("恭喜！本实训模块已全部完成！");
      setView('DASHBOARD');
      setCurrentStepIndex(0);
      setRemovedParts([]);
    }
  };

  // Define tools based on the selected module
  const TOOLS = useMemo(() => {
    if (selectedModule === 'REDUCER') {
        return [
            { type: ToolType.HAND, icon: Hand, label: '徒手/搬运', size: 20 },
            { type: ToolType.WRENCH_SMALL, icon: Wrench, label: '通用扳手 (小)', size: 16 },
            { type: ToolType.WRENCH_LARGE, icon: Wrench, label: '力矩扳手 (大)', size: 24 },
            { type: ToolType.PULLER, icon: Settings, label: '拔轮器', size: 20 },
            { type: ToolType.HAMMER, icon: Hammer, label: '橡胶锤', size: 20 },
        ];
    } else {
        // Engine tools (Optimized)
        return [
            { type: ToolType.WRENCH_SMALL, icon: Wrench, label: '管路扳手', size: 18 },
            { type: ToolType.WRENCH_LARGE, icon: Wrench, label: '力矩/套筒', size: 22 },
            { type: ToolType.HOIST, icon: Anchor, label: '航空吊具', size: 22 },
        ];
    }
  }, [selectedModule]);

  // 1. MODULE SELECTION SCREEN
  if (view === 'SELECTION') {
      return (
          <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
              
              <div className="z-10 text-center mb-12">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="bg-blue-600/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-2xl shadow-blue-500/20 border border-blue-500/30 relative group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                        <AppLogo className="w-16 h-16 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-4xl font-black text-white tracking-tight leading-none">数智小航</h1>
                        <h2 className="text-xl font-bold text-blue-400 tracking-wider mt-2">基于 Tripo AI 的航空设备数字化3D智能教学平台</h2>
                    </div>
                  </div>
                  <p className="text-lg text-slate-400 font-light max-w-4xl mx-auto leading-relaxed">
                      集成 <span className="text-white font-medium border-b border-blue-500/30">皮带输送线</span>、
                      <span className="text-white font-medium border-b border-blue-500/30">旋转码垛</span>、
                      <span className="text-white font-medium border-b border-blue-500/30">三轴运动</span>、
                      <span className="text-white font-medium border-b border-blue-500/30">四工位转盘</span>、
                      <span className="text-white font-medium border-b border-blue-500/30">凸轮输送</span> 及 
                      <span className="text-white font-medium border-b border-blue-500/30">升降模组</span> 的软硬结合综合实训平台。
                      <br/>
                      请选择下方的数字孪生课程模块或接入外部硬件管理终端。
                  </p>
              </div>

              <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
                  {/* Module 1: Reducer */}
                  <button 
                    onClick={() => handleSelectModule('REDUCER')}
                    className="group bg-slate-900/80 backdrop-blur border border-slate-700 p-6 rounded-2xl text-left hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Settings size={100} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col">
                          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">Module 01</span>
                          <h2 className="text-xl font-bold text-white mt-2 mb-2 group-hover:text-blue-300 transition-colors">单级圆柱齿轮减速器</h2>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                              机械工程基础核心实训。包含箱体拆解、轴系分离及精密装配全流程。
                          </p>
                          <div className="flex items-center text-sm font-bold text-blue-500 group-hover:translate-x-2 transition-transform mt-auto">
                              进入课程 <span className="ml-2">→</span>
                          </div>
                      </div>
                  </button>

                  {/* Module 2: Engine */}
                  <button 
                    onClick={() => handleSelectModule('ENGINE')}
                    className="group bg-slate-900/80 backdrop-blur border border-slate-700 p-6 rounded-2xl text-left hover:border-emerald-500 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <RefreshCcw size={100} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col">
                          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Module 02</span>
                          <h2 className="text-xl font-bold text-white mt-2 mb-2 group-hover:text-emerald-300 transition-colors">涡扇航空发动机</h2>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                              航空维修专业进阶实训。学习大涵道比涡扇发动机的单元体构造。
                          </p>
                          <div className="flex items-center text-sm font-bold text-emerald-500 group-hover:translate-x-2 transition-transform mt-auto">
                              进入课程 <span className="ml-2">→</span>
                          </div>
                      </div>
                  </button>

                  {/* External Module A: Independent Viewer */}
                  <button 
                    onClick={() => window.open('http://127.0.0.1:14741', '_blank')} 
                    className="group bg-slate-900/60 backdrop-blur border border-slate-700 p-6 rounded-2xl text-left hover:border-purple-500 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Box size={100} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-start">
                             <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">External Hardware Link</span>
                             <ExternalLink size={14} className="text-purple-400" />
                          </div>
                          <h2 className="text-xl font-bold text-white mt-2 mb-2 group-hover:text-purple-300 transition-colors">高精度模型独立拆解演练终端</h2>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                              配合硬件实操的数字孪生环境。具备<span className="text-purple-300">爆炸视图</span>、<span className="text-purple-300">动画控制</span>及步骤编排功能，支持三轴运动模块的虚拟调试。
                          </p>
                          <div className="flex items-center text-sm font-bold text-purple-500 group-hover:translate-x-2 transition-transform mt-auto">
                              打开终端 <span className="ml-2">↗</span>
                          </div>
                      </div>
                  </button>

                  {/* External Module B: SQCDP Dashboard */}
                  <button 
                    onClick={() => window.open('http://127.0.0.1:41723', '_blank')}
                    className="group bg-slate-900/60 backdrop-blur border border-slate-700 p-6 rounded-2xl text-left hover:border-orange-500 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Server size={100} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-start">
                             <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">Management Board</span>
                             <ExternalLink size={14} className="text-orange-400" />
                          </div>
                          <h2 className="text-xl font-bold text-white mt-2 mb-2 group-hover:text-orange-300 transition-colors">产线 S.Q.C.D.P 数字化管理看板</h2>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                              T313离心泵叶轮智能磨抛单元实时监控。集成皮带线与旋转码垛单元的<span className="text-orange-300">安全、质量、成本、交付、人员</span>五维数据可视化。
                          </p>
                          <div className="flex items-center text-sm font-bold text-orange-500 group-hover:translate-x-2 transition-transform mt-auto">
                              打开看板 <span className="ml-2">↗</span>
                          </div>
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  // 2. DASHBOARD
  if (view === 'DASHBOARD') {
    return (
        <>
            {/* Back to Selection Button */}
            <div className="fixed top-6 left-8 z-50">
                <button 
                    onClick={() => setView('SELECTION')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} /> 返回系统主页
                </button>
            </div>
            <Dashboard 
                onStart={handleStart} 
                course={activeCourse} 
            />
        </>
    );
  }

  // 3. SIMULATION
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 z-20 shrink-0 relative">
        <div className="flex items-center gap-4">
            {/* Logo Container: Fixed Branding Style (Blue/Glass) - No longer changes color based on module */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-blue-600/20 border border-blue-500/30 shadow-blue-500/20 backdrop-blur-sm">
                <AppLogo className="w-7 h-7" />
            </div>
            <div>
                <h1 className="font-bold text-lg tracking-wide text-slate-100">数智小航</h1>
                <p className="text-xs text-slate-400 font-medium">
                    {activeCourse.title}
                    <span className="mx-2 text-slate-600">|</span>
                    {mode === 'STUDENT' ? `步骤 ${currentStepIndex + 1}/${activeCourse.curriculum.length}` : '实训监控中心'}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold ${mode === 'TEACHER' ? 'bg-purple-900/50 text-purple-200 border border-purple-500/30' : 'bg-blue-900/50 text-blue-200 border border-blue-500/30'}`}>
                {mode === 'TEACHER' ? <Monitor size={14} /> : <Eye size={14} />}
                {mode === 'TEACHER' ? '教师总控模式' : '学生视图模式'}
            </div>
            
            <div className="w-px h-6 bg-slate-700"></div>
            
            <button 
                onClick={() => setView('DASHBOARD')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
            >
                退出实训
            </button>
        </div>

        {/* Progress Bar (Bottom of Header) - Visible in Student Mode */}
        {mode === 'STUDENT' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900/50">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mode === 'TEACHER' ? (
            <div className="flex-1 bg-slate-950 overflow-hidden relative">
                 <TeacherStats stats={stats} chatHistory={chatHistory} />
            </div>
        ) : (
            <>
                {/* 左侧边栏 */}
                <div className="w-24 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-6 z-10">
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[40vh] no-scrollbar">
                        {activeCourse.curriculum.map((s, i) => (
                            <div 
                                key={s.id} 
                                className={`w-3 h-3 rounded-full cursor-pointer transition-all shrink-0 ${i === currentStepIndex ? 'bg-blue-500 scale-125' : i < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                onClick={() => { 
                                    // Prevent skipping if quiz is not passed could be implemented here, 
                                    // but for now allow navigation to previous steps
                                    if(i < currentStepIndex) setCurrentStepIndex(i); 
                                }} 
                                title={s.title}
                            />
                        ))}
                    </div>
                    
                    <div className="w-10 h-px bg-slate-600 my-2"></div>
                    
                    <div className="flex flex-col gap-3 w-full px-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase text-center w-full">工具箱</p>
                        {TOOLS.map((tool) => (
                            <button 
                                key={tool.type}
                                onClick={() => { setActiveTool(tool.type); setIsAnnotationMode(false); }}
                                disabled={isAnnotationMode || currentStep.actionType === 'INSPECT'}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all 
                                    ${activeTool === tool.type ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'} 
                                    ${(isAnnotationMode || currentStep.actionType === 'INSPECT') ? 'opacity-30 cursor-not-allowed' : ''}
                                `}
                                title={tool.label}
                            >
                                <tool.icon size={tool.size} className="mb-1" />
                                <span className="text-[10px] font-medium leading-none text-center transform scale-90">{tool.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="w-10 h-px bg-slate-600 my-2"></div>

                    <div className="flex flex-col gap-3 w-full px-2">
                        <button 
                            onClick={() => { setIsAnnotationMode(!isAnnotationMode); setActiveTool(ToolType.NONE); }}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isAnnotationMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-110' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                            title="模型标注 (解构视图)"
                        >
                            <Layers size={20} className="mb-1" />
                            <span className="text-[10px] font-medium leading-none text-center transform scale-90">标注</span>
                        </button>
                    </div>

                     <div className="mt-auto">
                        <button 
                            onClick={() => { setRemovedParts([]); setCurrentStepIndex(0); setIsAnnotationMode(false); }}
                            className="p-3 rounded-xl bg-slate-700 text-slate-400 hover:text-white hover:bg-red-500 transition-colors" 
                            title="重置场景"
                        >
                            <RefreshCcw size={20} />
                        </button>
                     </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 relative flex">
                    <div className="w-2/3 relative">
                        <ThreeScene 
                            parts={activeCourse.parts}
                            activeTool={activeTool} 
                            removedParts={removedParts} 
                            onPartInteract={handlePartInteract} 
                            onWrongTool={handleWrongTool}
                            currentActionType={currentStep.actionType}
                            targetPartIds={currentStep.targetPartIds}
                            isAnnotationMode={isAnnotationMode}
                            modelType={selectedModule}
                        />
                        
                        {!isAnnotationMode && (
                            <div className="absolute top-6 right-6 pointer-events-none">
                                <div className={`px-4 py-2 rounded-lg backdrop-blur-md border shadow-xl font-bold text-sm tracking-wider uppercase
                                    ${currentStep.actionType === 'DISASSEMBLE' 
                                        ? 'bg-red-900/50 border-red-500/50 text-red-200' 
                                        : currentStep.actionType === 'ASSEMBLE'
                                            ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-200'
                                            : 'bg-cyan-900/50 border-cyan-500/50 text-cyan-200' // INSPECT
                                    }`}>
                                    当前模式: {
                                        currentStep.actionType === 'DISASSEMBLE' ? '拆解' : 
                                        currentStep.actionType === 'ASSEMBLE' ? '组装' : '原理与结构认知'
                                    }
                                </div>
                            </div>
                        )}

                        {isAnnotationMode && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                                <div className="px-6 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-2xl animate-in slide-in-from-top-4">
                                     <h3 className="text-white font-serif tracking-[0.2em] uppercase text-sm flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                        {activeCourse.title} - Decomposition
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                     </h3>
                                </div>
                            </div>
                        )}

                        {/* AI 助教 */}
                        <div className="absolute bottom-6 right-6 z-10">
                            <button 
                                onClick={() => setShowAIHint(!showAIHint)}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 p-3 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce-slow"
                            >
                                <Lightbulb size={24} fill="currentColor" />
                            </button>
                            {showAIHint && (
                                <div className="absolute bottom-14 right-0 w-72 bg-white text-slate-800 p-4 rounded-xl shadow-2xl border-2 border-yellow-400 animate-in slide-in-from-bottom-5">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <span className="bg-yellow-100 p-1 rounded">AI 智能提示</span>
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-3">{currentStep.aiHint}</p>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(currentStep.aiHint.replace("Ask AI: ", ""));
                                            alert("AI 提示词已复制到剪贴板！");
                                        }}
                                        className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded font-semibold w-full"
                                    >
                                        复制提示词
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧面板 */}
                    <div className="w-1/3 bg-slate-800 border-l border-slate-700 h-full p-6">
                        <ScenarioOverlay 
                            step={currentStep} 
                            onNext={nextStep} 
                            canAdvance={canAdvance()}
                            onQuizComplete={handleQuizComplete}
                            messages={chatHistory}
                            onSendMessage={handleSendMessage}
                            onRecordingComplete={handleRecordingComplete}
                        />
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}