

import { CourseModule, PartData, ScenarioType, TaskStep, ToolType, QuizQuestion } from './types.ts';

// ==========================================
// 1. 减速器数据 (REDUCER)
// ==========================================
const REDUCER_PARTS: PartData[] = [
  {
    id: 'housing',
    name: '减速器箱体',
    type: 'housing',
    requiredTool: ToolType.NONE, // Base part, usually fixed
    position: [0, -1.0, 0], 
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#334155', // castIron
    description: '减速器底座箱体，支撑轴系并储油。',
    explodedPosition: [0, -1.0, 0], 
    explodedRotation: [0, 0, 0],
    annotationHeight: -1.0
  },
  {
    id: 'obs_bolt_1', name: '观察盖螺栓 M6', type: 'bolt', requiredTool: ToolType.WRENCH_SMALL,
    position: [-0.6, 2.15, 0.35], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#94A3B8',
    description: '固定观察盖的小型螺栓。', explodedPosition: [-4.5, -1.9, 0], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 5.5
  },
  {
    id: 'obs_bolt_2', name: '观察盖螺栓 M6', type: 'bolt', requiredTool: ToolType.WRENCH_SMALL,
    position: [0.6, 2.15, 0.35], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#94A3B8',
    description: '固定观察盖的小型螺栓。', explodedPosition: [-4.5, -1.9, 0.5], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 5.5
  },
  {
    id: 'obs_bolt_3', name: '观察盖螺栓 M6', type: 'bolt', requiredTool: ToolType.WRENCH_SMALL,
    position: [-0.6, 2.15, -0.35], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#94A3B8',
    description: '固定观察盖的小型螺栓。', explodedPosition: [-4.5, -1.9, 1.0], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 5.5
  },
  {
    id: 'obs_bolt_4', name: '观察盖螺栓 M6', type: 'bolt', requiredTool: ToolType.WRENCH_SMALL,
    position: [0.6, 2.15, -0.35], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#94A3B8',
    description: '固定观察盖的小型螺栓。', explodedPosition: [-4.5, -1.9, 1.5], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 5.5
  },
  {
    id: 'obs_cover', name: '观察盖板 (视窗)', type: 'obs_cover', requiredTool: ToolType.HAND, dependencyId: 'obs_bolt_4',
    position: [0, 2.05, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#64748b',
    description: '用于检查齿轮啮合情况及注入润滑油的窗口盖板。', explodedPosition: [-4.5, -1.9, -1.5], explodedRotation: [0, 0, 0], annotationHeight: 4.8
  },
  {
    id: 'bolt_1', name: '六角螺栓 M10', type: 'bolt', requiredTool: ToolType.WRENCH_LARGE,
    position: [-2.6, 0.2, 1.6], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#CBD5E1',
    description: '紧固螺栓。', explodedPosition: [4.5, -1.8, 0], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 1.5
  },
  {
    id: 'bolt_2', name: '六角螺栓 M10', type: 'bolt', requiredTool: ToolType.WRENCH_LARGE,
    position: [2.6, 0.2, 1.6], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#CBD5E1',
    description: '紧固螺栓。', explodedPosition: [4.5, -1.8, 0.8], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 1.5
  },
  {
    id: 'bolt_3', name: '六角螺栓 M10', type: 'bolt', requiredTool: ToolType.WRENCH_LARGE,
    position: [-2.6, 0.2, -1.6], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#CBD5E1',
    description: '紧固螺栓。', explodedPosition: [4.5, -1.8, 1.6], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 1.5
  },
  {
    id: 'bolt_4', name: '六角螺栓 M10', type: 'bolt', requiredTool: ToolType.WRENCH_LARGE,
    position: [2.6, 0.2, -1.6], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#CBD5E1',
    description: '紧固螺栓。', explodedPosition: [4.5, -1.8, 2.4], explodedRotation: [Math.PI / 2, 0, 0], annotationHeight: 1.5
  },
  {
    id: 'housing_cover', name: '减速器箱盖', type: 'cover', requiredTool: ToolType.HAND, dependencyId: 'bolt_4',
    position: [0, 1.0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#36383B',
    description: '箱盖顶部设有观察孔。', explodedPosition: [0, 4.0, -3.0], explodedRotation: [-Math.PI / 6, 0, 0], annotationHeight: 3.2
  },
  {
    id: 'input_shaft_assy', name: '高速轴组件', type: 'shaft', requiredTool: ToolType.PULLER, assemblyTool: ToolType.HAMMER, dependencyId: 'housing_cover',
    position: [-1.0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#E2E8F0',
    description: '高速输入轴。', explodedPosition: [-3.0, 1.5, 3.0], explodedRotation: [0, 0, Math.PI / 6], annotationHeight: 0.5
  },
  {
    id: 'output_gear_assy', name: '低速轴组件', type: 'gear', requiredTool: ToolType.PULLER, assemblyTool: ToolType.HAMMER, dependencyId: 'input_shaft_assy',
    position: [1.0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#F1F5F9',
    description: '低速输出轴。', explodedPosition: [3.0, 1.5, 3.0], explodedRotation: [0, 0, -Math.PI / 6], annotationHeight: 0.5
  }
];

const REDUCER_QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: "单级圆柱齿轮减速器的主要功能是什么？", options: ["减速增扭", "增速减扭", "仅改变传动方向", "储存和冷却润滑油"], correctIndex: 0 },
  { id: 2, question: "为什么减速器箱体通常采用剖分式结构？", options: ["为了外观美观", "便于轴系部件的安装与拆卸", "为了节省铸造材料", "为了增加箱体重量"], correctIndex: 1 }
];

const REDUCER_CURRICULUM: TaskStep[] = [
  { 
    id: 100, 
    title: "1. 减速器原理概述", 
    description: "【教学目标】\n理解单级圆柱齿轮减速器的基本功能。\n\n【运行原理】\n利用齿轮啮合原理，将电机的高转速转化为工作机所需的低转速，并增大扭矩。动力由高速轴输入，经小齿轮带动大齿轮，最后由低速轴输出。\n\n【注意事项】\n拆解前必须放空润滑油，并清理表面油污。拆卸过程中需注意保护箱体结合面。", 
    scenario: ScenarioType.BLACKBOARD, 
    targetPartIds: [], 
    aiHint: "减速器的核心作用是匹配转速和传递扭矩。", 
    actionType: 'INSPECT' 
  },
  { 
    id: 101, 
    title: "2. 结构认知：箱体组件", 
    description: "【结构认知】\n请观察高亮显示的【箱盖】与【箱座】。\n\n它们采用剖分式结构，通过定位销和螺栓连接。箱体的主要作用是支撑轴系部件，保证齿轮的正确啮合，并兼具储油和散热功能。", 
    scenario: ScenarioType.DISCUSSION, 
    targetPartIds: ['housing', 'housing_cover'], 
    aiHint: "为什么箱体分为上下两部分？是为了方便轴系的安装。", 
    actionType: 'INSPECT' 
  },
  { 
    id: 102, 
    title: "3. 结构认知：传动组件", 
    description: "【结构认知】\n请观察高亮显示的【高速轴】与【低速轴】。\n\n高速轴通常与小齿轮制成一体（齿轮轴），低速轴则通过键连接大齿轮。二者通过滚动轴承支撑在箱体上。", 
    scenario: ScenarioType.DISCUSSION, 
    targetPartIds: ['input_shaft_assy', 'output_gear_assy'], 
    aiHint: "小齿轮齿数少转速快，大齿轮齿数多转速慢。", 
    actionType: 'INSPECT' 
  },
  
  { 
    id: 103, 
    title: "4. 理论知识考核", 
    description: "在进入实操拆解前，请完成以下原理考核，确保您已掌握设备基础知识。", 
    scenario: ScenarioType.QUIZ, 
    targetPartIds: [], 
    aiHint: "回顾刚才学习的运行原理和结构组成。", 
    actionType: 'DISASSEMBLE', // Transition to action phase logic
    quizData: REDUCER_QUIZ_QUESTIONS
  },

  { id: 1, title: "5. 预处理", description: "检查外观，清理油污。", scenario: ScenarioType.BLACKBOARD, targetPartIds: [], aiHint: "检查漏油情况。", actionType: 'DISASSEMBLE' },
  { id: 2, title: "6. 拆卸观察盖", description: "拆卸顶部的4颗M6螺栓。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['obs_bolt_1', 'obs_bolt_2', 'obs_bolt_3', 'obs_bolt_4', 'obs_cover'], aiHint: "对角线拆卸。", actionType: 'DISASSEMBLE' },
  { id: 3, title: "7. 拆卸结合面螺栓", description: "松开M10六角螺栓。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['bolt_1', 'bolt_2', 'bolt_3', 'bolt_4'], aiHint: "分次旋松。", actionType: 'DISASSEMBLE' },
  { id: 4, title: "8. 揭开箱盖", description: "垂直向上移除箱盖。", scenario: ScenarioType.DISCUSSION, targetPartIds: ['housing_cover'], aiHint: "注意定位销。", actionType: 'DISASSEMBLE' },
  { id: 5, title: "9. 移出轴系", description: "使用拔轮器拉出轴系。", scenario: ScenarioType.PODIUM, targetPartIds: ['input_shaft_assy', 'output_gear_assy'], aiHint: "保护中心孔。", actionType: 'DISASSEMBLE' },
  
  { id: 6, title: "10. 安装轴系", description: "【组装】装回轴系。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['input_shaft_assy', 'output_gear_assy'], aiHint: "注意啮合。", actionType: 'ASSEMBLE' },
  { id: 7, title: "11. 合上箱盖", description: "涂抹密封胶，合盖。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['housing_cover'], aiHint: "对准销孔。", actionType: 'ASSEMBLE' },
  { id: 8, title: "12. 紧固螺栓", description: "拧紧连接螺栓。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['bolt_1', 'bolt_2', 'bolt_3', 'bolt_4'], aiHint: "对角线拧紧。", actionType: 'ASSEMBLE' },
  { id: 9, title: "13. 安装观察盖", description: "安装观察盖及螺栓。", scenario: ScenarioType.DISCUSSION, targetPartIds: ['obs_cover', 'obs_bolt_1', 'obs_bolt_2', 'obs_bolt_3', 'obs_bolt_4'], aiHint: "完成试车。", actionType: 'ASSEMBLE' }
];

// ==========================================
// 2. 航空发动机数据 (AERO ENGINE)
// ==========================================
// 重新计算的位置以实现无缝贴合
// 标注策略：分层爆炸视图
// - 机匣 (Casings): 向后 (Z-) 和两侧 (X) 移动
// - 转子 (Rotors): 向上 (Y+) 和两侧 (X) 移动
// - 附件 (Accessories): 向前 (Z+) 或上下极端移动

const ENGINE_PARTS: PartData[] = [
  // 1. External & Transmission
  {
    id: 'eng_pipe_top',
    name: '燃油与冷却管路 (Pipes)',
    type: 'engine_pipe',
    requiredTool: ToolType.WRENCH_SMALL,
    position: [1.0, 0.5, 0], 
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#cbd5e1',
    description: '负责输送燃油与液压油的外部管路，需优先拆除。',
    explodedPosition: [1.0, 4.5, 0],
    explodedRotation: [0, 0, 0],
    annotationHeight: 3.5,
    annotationOffset: [0, 5.0, 0] // Top layer
  },
  {
    id: 'eng_gearbox',
    name: '传动锥齿轮与机匣 (Transmission)',
    type: 'engine_gearbox',
    requiredTool: ToolType.WRENCH_LARGE,
    dependencyId: 'eng_pipe_top',
    position: [-0.2, -1.3, 0], 
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#94a3b8',
    description: '包含锥齿轮（Bevel Gears）和附件传动箱，用于提取动力驱动发电机和油泵。',
    explodedPosition: [-0.2, -3.5, 2],
    explodedRotation: [0.5, 0, 0],
    annotationHeight: -2.5,
    annotationOffset: [0, -2.5, 2.0] // Bottom + Front (Z+)
  },
  // 2. Exhaust
  {
    id: 'eng_nozzle',
    name: '尾喷管组件 (Nozzle)',
    type: 'engine_nozzle',
    requiredTool: ToolType.WRENCH_LARGE,
    dependencyId: 'eng_gearbox',
    position: [4.3, 0.5, 0], 
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#475569', 
    description: '耐高温合金制成的尾喷管。',
    explodedPosition: [8.0, 0.5, 0],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 0,
    annotationOffset: [3.5, 0, -2.5] // Far Right + Back (Z-)
  },
  // 3. Low Pressure Turbine (LPT)
  {
    id: 'eng_lpt',
    name: '低压涡轮 (Low Pressure Turbine)',
    type: 'engine_lpt',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_nozzle',
    position: [3.1, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#57534e',
    description: '由多级转子叶片组成，回收废气能量驱动前端风扇。',
    explodedPosition: [5.0, 0.5, 2.0],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 1.5,
    annotationOffset: [3.5, 2.5, 0] // Far Right + Up (Y+)
  },
  // 4. High Pressure Turbine (HPT)
  {
    id: 'eng_hpt',
    name: '高压涡轮 (High Pressure Turbine)',
    type: 'engine_hpt',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_lpt',
    position: [2.15, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#78350f', 
    description: '承受最高温度部件，驱动高压压气机。',
    explodedPosition: [3.5, 0.5, 2.0],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 1.0,
    annotationOffset: [2.5, 2.5, 0] // Right + Up (Y+)
  },
  // 5. Combustion Chamber
  {
    id: 'eng_combustor',
    name: '燃烧室 (Combustion Chamber)',
    type: 'engine_combustor',
    requiredTool: ToolType.WRENCH_LARGE,
    dependencyId: 'eng_hpt',
    position: [1.5, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#b45309',
    description: '高压空气与燃油混合燃烧的区域。',
    explodedPosition: [1.6, 3.5, 0],
    explodedRotation: [Math.PI/4, 0, 0],
    annotationHeight: 2.2,
    annotationOffset: [1.5, 4.0, 0] // Center Right + High Up
  },
  // 6. High Pressure Compressor (HPC)
  {
    id: 'eng_hpc',
    name: '高压压气机 (High Pressure Compressor)',
    type: 'engine_hpc',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_combustor',
    position: [0.35, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#059669', 
    description: '核心机组件，多级轴流压缩，绿色防腐涂层。',
    explodedPosition: [0.4, 0.5, 2.5],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 0,
    annotationOffset: [0.5, 2.5, 0] // Center + Up
  },
  // 7. Intermediate Case
  {
    id: 'eng_ipc',
    name: '中间机匣 (Intermediate Case)',
    type: 'engine_ipc',
    requiredTool: ToolType.WRENCH_LARGE,
    dependencyId: 'eng_hpc',
    position: [-0.7, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#94a3b8',
    description: '连接低压与高压段的结构件，包含轴承座。',
    explodedPosition: [-1.0, 3.5, 0],
    explodedRotation: [0, 0, 0],
    annotationHeight: 2.5,
    annotationOffset: [-1.0, 0, -3.0] // Center Left + Back (Z-)
  },
  // 8. Low Pressure Compressor (LPC/Booster)
  {
    id: 'eng_lpc',
    name: '低压压气机 (Low Pressure Compressor)',
    type: 'engine_lpc',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_ipc',
    position: [-1.4, 0.5, 0],
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#cbd5e1',
    description: '位于风扇后方，进一步压缩空气进入核心机。',
    explodedPosition: [-2.0, 0.5, 2.0],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 1.0,
    annotationOffset: [-2.5, 2.5, 0] // Left + Up
  },
  // 9. Fan Case
  {
    id: 'eng_fan_case',
    name: '风扇机匣 (Fan Case)',
    type: 'engine_fan_case',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_lpc',
    position: [-2.8, 0.5, 0], 
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#e2e8f0', 
    description: '最前端的外壳，包含进气道和包容环。',
    explodedPosition: [-5.0, 0.5, 0],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 3.0,
    annotationOffset: [-5.0, 0, -4.0] // Far Left + Back (Z-) - Moved Further back to avoid clipping
  },
  // 10. Fan Rotor
  {
    id: 'eng_fan_rotor',
    name: '风扇叶片组件 (Fan Blade Assembly)',
    type: 'engine_fan_rotor',
    requiredTool: ToolType.HOIST,
    dependencyId: 'eng_fan_case',
    position: [-2.8, 0.5, 0], 
    rotation: [0, 0, -Math.PI / 2],
    scale: [1, 1, 1],
    color: '#1e293b', 
    description: '前端大型风扇叶片，产生大部分推力。',
    explodedPosition: [-2.8, 0.5, 3.5],
    explodedRotation: [0, 0, -Math.PI / 2],
    annotationHeight: 0,
    annotationOffset: [-5.0, 4.0, 0] // Far Left + High Up (Y+) - Lifted higher to avoid clipping
  },
  // Stand (Always present)
  {
    id: 'eng_stand',
    name: '发动机运输托架 (Dolly)',
    type: 'engine_stand',
    requiredTool: ToolType.NONE, 
    position: [0.5, -3.5, 0], 
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#facc15', 
    description: '用于发动机地面运输与支撑的专用台架。',
    explodedPosition: [0.5, -3.5, 0], 
    explodedRotation: [0, 0, 0],
    annotationHeight: -1.0,
    annotationOffset: [0, -3.0, 0] // Down (Y-)
  }
];

const ENGINE_QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: "涡扇发动机产生推力的主要来源是什么？", options: ["仅靠内涵道喷气", "外涵道风扇排气与内涵道喷气共同作用", "仅靠风扇旋转", "燃烧室直接喷出"], correctIndex: 1 },
  { id: 2, question: "传动组件（锥齿轮）的主要作用是什么？", options: ["增加推力", "改变气流方向", "驱动发电机和油泵等附件", "冷却燃烧室"], correctIndex: 2 },
  { id: 3, question: "高压涡轮（HPT）直接驱动哪个部件？", options: ["风扇", "低压压气机", "高压压气机", "尾喷管"], correctIndex: 2 }
];

const ENGINE_CURRICULUM: TaskStep[] = [
  // 1. 认知环节
  { 
    id: 200, 
    title: "1. 涡扇发动机总体认知", 
    description: "【教学目标】\n掌握大涵道比涡扇发动机的基本工作原理。\n\n【工作原理】\n空气经风扇吸入，部分进入内涵道（核心机）经压缩、燃烧、膨胀作功，部分流经外涵道直接产生推力。外涵道气流产生的推力占总推力的70%-80%。\n\n【注意事项】\n发动机结构精密，任何外来异物（FOD）都可能导致严重损坏。", 
    scenario: ScenarioType.BLACKBOARD, 
    targetPartIds: [], 
    aiHint: "大涵道比设计是为了提高燃油效率和降低噪音。", 
    actionType: 'INSPECT' 
  },
  { 
    id: 201, 
    title: "2. 结构认知：冷端部件", 
    description: "【结构认知】\n请观察高亮显示的【风扇】与【压气机】。\n\n风扇（Fan）位于最前端，负责吸入空气；压气机（LPC/HPC）负责逐级压缩空气，提高气流压力，为燃烧做准备。这些部件工作温度相对较低，统称冷端。", 
    scenario: ScenarioType.DISCUSSION, 
    targetPartIds: ['eng_fan_rotor', 'eng_lpc', 'eng_hpc', 'eng_fan_case'], 
    aiHint: "压气机采用多级轴流式结构，逐级增压。", 
    actionType: 'INSPECT' 
  },
  { 
    id: 202, 
    title: "3. 结构认知：热端部件", 
    description: "【结构认知】\n请观察高亮显示的【燃烧室】与【涡轮】。\n\n燃烧室（Combustor）内燃油与高压空气混合燃烧；高温燃气驱动高压涡轮（HPT）和低压涡轮（LPT）高速旋转，分别带动前方的压气机和风扇。这些部件需承受极高温度。", 
    scenario: ScenarioType.DISCUSSION, 
    targetPartIds: ['eng_combustor', 'eng_hpt', 'eng_lpt'], 
    aiHint: "热端部件通常采用昂贵的镍基高温合金制造。", 
    actionType: 'INSPECT' 
  },

  // 2. 考核环节
  { 
    id: 203, 
    title: "4. 理论知识考核", 
    description: "在进入实操拆解前，请完成以下原理考核，确保您已掌握设备基础知识。", 
    scenario: ScenarioType.QUIZ, 
    targetPartIds: [], 
    aiHint: "回顾冷端和热端的主要区别。", 
    actionType: 'DISASSEMBLE', // Transition phase
    quizData: ENGINE_QUIZ_QUESTIONS
  },

  // 3. 拆解环节
  { id: 211, title: "5. 准备与管路拆卸", description: "【拆解】拆除外部燃油与冷却管路（Fuel Pipe/Cooling Pipe），断开与机身的连接接口。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['eng_pipe_top'], aiHint: "注意管路中的残余燃油。", actionType: 'DISASSEMBLE' },
  { id: 212, title: "6. 拆卸传动组件", description: "【拆解】拆卸下方的锥齿轮传动箱（Bevel Gears/Gearbox）。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['eng_gearbox'], aiHint: "传动轴连接处需要小心脱开。", actionType: 'DISASSEMBLE' },
  { id: 213, title: "7. 尾喷管与涡轮拆解", description: "【拆解】依次拆卸尾喷管、低压涡轮（LPT）和高压涡轮（HPT）。", scenario: ScenarioType.PODIUM, targetPartIds: ['eng_nozzle', 'eng_lpt', 'eng_hpt'], aiHint: "涡轮叶片耐高温但脆性大，防止磕碰。", actionType: 'DISASSEMBLE' },
  { id: 214, title: "8. 核心机拆解", description: "【拆解】移除燃烧室（Combustion Chamber）和高压压气机（HPC）。", scenario: ScenarioType.DISCUSSION, targetPartIds: ['eng_combustor', 'eng_hpc'], aiHint: "观察燃烧室内壁的积碳情况。", actionType: 'DISASSEMBLE' },
  { id: 215, title: "9. 风扇段拆解", description: "【拆解】拆卸中间机匣、低压压气机、风扇机匣及风扇转子。", scenario: ScenarioType.WORKBOOK, targetPartIds: ['eng_ipc', 'eng_lpc', 'eng_fan_case', 'eng_fan_rotor'], aiHint: "风扇叶片尺寸大，需使用专用吊具。", actionType: 'DISASSEMBLE' },

  // 4. 组装环节
  { 
    id: 220, 
    title: "10. 风扇装配 (Fan Assembly)", 
    description: "【装配】\n1. 将风扇叶片逐一安装到风扇盘上。\n2. 安装前端的风扇机匣。\n通过工具紧固，形成完整的风扇组件。", 
    scenario: ScenarioType.WORKBOOK, 
    targetPartIds: ['eng_fan_rotor', 'eng_fan_case'], 
    aiHint: "确保叶片安装顺序以保证动平衡。", 
    actionType: 'ASSEMBLE' 
  },
  { 
    id: 221, 
    title: "11. 压气机装配 (Compressor)", 
    description: "【装配】\n1. 安装低压压气机（Low-breeze Rotor/Stator）。\n2. 安装中间机匣（Intermediate Case）。\n3. 组装高压压气机（High Pressure Compressor）。\n转子与静子部件通过精准对齐和紧固，逐步堆叠。", 
    scenario: ScenarioType.WORKBOOK, 
    targetPartIds: ['eng_lpc', 'eng_ipc', 'eng_hpc'], 
    aiHint: "注意转子与静子之间的间隙控制。", 
    actionType: 'ASSEMBLE' 
  },
  { 
    id: 222, 
    title: "12. 燃烧室装配 (Combustion)", 
    description: "【装配】\n将燃烧室部件安装到位，确保燃油喷射结构的完整性。", 
    scenario: ScenarioType.DISCUSSION, 
    targetPartIds: ['eng_combustor'], 
    aiHint: "检查燃油喷嘴的安装角度。", 
    actionType: 'ASSEMBLE' 
  },
  { 
    id: 223, 
    title: "13. 涡轮装配 (Turbine)", 
    description: "【装配】\n1. 安装高压涡轮（HPT），连接高压轴。\n2. 安装低压涡轮（LPT），连接低压轴。\n涉及复杂的叶片安装和部件连接。", 
    scenario: ScenarioType.PODIUM, 
    targetPartIds: ['eng_hpt', 'eng_lpt'], 
    aiHint: "高压涡轮需承受极高温度，安装时需涂抹高温防卡剂。", 
    actionType: 'ASSEMBLE' 
  },
  { 
    id: 224, 
    title: "14. 传动与总装 (Final Integration)", 
    description: "【装配】\n1. 安装尾喷管。\n2. 安装锥齿轮传动组件（Bevel Gears）及附件机匣。\n3. 连接燃油与冷却管道（Pipes）。\n最终形成完整的涡扇发动机。", 
    scenario: ScenarioType.WORKBOOK, 
    targetPartIds: ['eng_nozzle', 'eng_gearbox', 'eng_pipe_top'], 
    aiHint: "最后进行全面的FOD（异物）检查。", 
    actionType: 'ASSEMBLE' 
  }
];

// Export Modules
export const COURSES: Record<string, CourseModule> = {
  REDUCER: {
    id: 'REDUCER',
    title: '单级圆柱齿轮减速器',
    subtitle: '机械工程基础实训',
    description: '掌握高精度工业减速器（长方形剖分式箱体）的拆解顺序、工具选用及安全操作规程。',
    parts: REDUCER_PARTS,
    curriculum: REDUCER_CURRICULUM
  },
  ENGINE: {
    id: 'ENGINE',
    title: '三转子涡扇发动机',
    subtitle: '航空维修专业实训',
    description: '基于真实的三转子/双转子结构建模。学习风扇、压气机、涡轮、燃烧室及传动部件的精密装配流程。',
    parts: ENGINE_PARTS,
    curriculum: ENGINE_CURRICULUM
  }
};

export const MODEL_PARTS = REDUCER_PARTS; 
export const CURRICULUM = REDUCER_CURRICULUM;
