
import React from 'react';
import { CourseModule, UserMode } from '../types.ts';
import { Activity, CheckCircle, Eye, Monitor } from 'lucide-react';
import { AppLogo } from './AppLogo.tsx';

interface Props {
  onStart: (mode: UserMode) => void;
  course: CourseModule;
}

export const Dashboard: React.FC<Props> = ({ onStart, course }) => {
  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center relative">
      
      {/* 顶部右上角模式选择区 - 竖向排列 */}
      <div className="absolute top-6 right-8 flex flex-col gap-3 z-20">
          <button 
              onClick={() => onStart('STUDENT')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 border border-blue-500/50 w-40"
          >
              <Eye size={18} />
              学生视图进入
          </button>
          <button 
              onClick={() => onStart('TEACHER')}
              className="bg-purple-700 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 border border-purple-500/50 w-40"
          >
              <Monitor size={18} />
              教师总控进入
          </button>
      </div>

      <header className="max-w-5xl w-full mb-12 text-center mt-8 flex flex-col items-center">
        <div className="mb-6 p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm shadow-xl inline-flex">
            <AppLogo className="w-20 h-20 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight font-sans">
          {course.title}
          <span className="text-slate-500 mx-2">|</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">{course.subtitle}</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light">
          {course.description}
        </p>
      </header>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧栏: 状态与信息 */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> 实训状态
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-2xl font-mono font-bold text-white">0%</div>
                    <div className="text-xs text-slate-500 uppercase mt-1">完成度</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-2xl font-mono font-bold text-white">45m</div>
                    <div className="text-xs text-slate-500 uppercase mt-1">标准学时</div>
                </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 rounded-xl p-6 border border-blue-500/30">
             <h3 className="text-blue-300 font-bold mb-2">前置课程要求</h3>
             <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 机械制图基础 (已修)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 金工实习安全认证 (已修)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 通用工具识别 (已修)</li>
             </ul>
          </div>
        </div>

        {/* 中间/右侧: 学习路径图 */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">实训任务路径</h2>
            
            <div className="relative pl-8 border-l-2 border-slate-700 space-y-8">
                {course.curriculum.map((step, index) => (
                    <div key={step.id} className="relative group">
                        {/* 时间轴点 */}
                        <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 border-slate-900 ${index === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-700 group-hover:bg-slate-600'} transition-colors`}></div>
                        
                        <div 
                             className={`bg-slate-800 p-6 rounded-xl border border-slate-700 transition-all ${index === 0 ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'opacity-60 grayscale'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">任务 {index + 1}</span>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                    {step.scenario === 'BLACKBOARD' ? '理论教学' : 
                                     step.scenario === 'WORKBOOK' ? '工单填写' :
                                     step.scenario === 'DISCUSSION' ? '小组讨论' : '翻转课堂'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-slate-400 text-sm mb-4">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
