


export enum ToolType {
  NONE = 'NONE',
  WRENCH_SMALL = 'WRENCH_SMALL', // For M6 bolts
  WRENCH_LARGE = 'WRENCH_LARGE', // For M10 bolts
  HAND = 'HAND',
  PULLER = 'PULLER',
  HAMMER = 'HAMMER',
  HOIST = 'HOIST' // New: For heavy engine parts
}

export enum ScenarioType {
  BLACKBOARD = 'BLACKBOARD', // Knowledge
  WORKBOOK = 'WORKBOOK',     // Practice
  DISCUSSION = 'DISCUSSION', // Peer view
  PODIUM = 'PODIUM',          // Feynman technique
  QUIZ = 'QUIZ'              // New: Assessment
}

export type UserMode = 'STUDENT' | 'TEACHER';
export type ModelType = 'REDUCER' | 'ENGINE';

export interface PartData {
  id: string;
  name: string;
  type: 'bolt' | 'cover' | 'gear' | 'housing' | 'shaft' | 'obs_cover' | 
        'engine_fan_case' | 'engine_fan_rotor' | 
        'engine_lpc' | // Low Pressure Compressor
        'engine_ipc' | // Intermediate Pressure Case
        'engine_hpc' | // High Pressure Compressor
        'engine_combustor' | // Combustion Chamber
        'engine_hpt' | // High Pressure Turbine
        'engine_lpt' | // Low Pressure Turbine
        'engine_gearbox' | // Transmission
        'engine_nozzle' | 'engine_stand' | 'engine_pipe';
  requiredTool: ToolType; // Primary tool (used for disassembly)
  assemblyTool?: ToolType; // Optional: Override tool for assembly phase
  dependencyId?: string; // ID of part that must be removed first (Disassembly logic)
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  description: string;
  // New: Target transform when part is disassembled
  explodedPosition?: [number, number, number];
  explodedRotation?: [number, number, number];
  // New: Vertical offset for Model Annotation Mode (Legacy)
  annotationHeight?: number; 
  // New: Full 3D offset for Model Annotation Mode (Preferred for complex models)
  annotationOffset?: [number, number, number];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TaskStep {
  id: number;
  title: string;
  description: string;
  scenario: ScenarioType;
  targetPartIds: string[]; // Parts involved in this step
  aiHint: string;
  actionType: 'DISASSEMBLE' | 'ASSEMBLE' | 'INSPECT'; // Added INSPECT for structure recognition
  quizData?: QuizQuestion[]; // New: Quiz questions
}

export interface StudentStats {
  timeSpent: number; // seconds
  errors: number;
  completedTasks: number;
  accuracy: number;
  quizScore?: number; // New: Quiz score
  recentRecordingUrl?: string; // New: URL for Feynman recording
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'STUDENT' | 'TEACHER' | 'EXPERT'; // EXPERT for pre-set messages
  text: string;
  time: string;
}

export interface CourseModule {
  id: ModelType;
  title: string;
  subtitle: string;
  description: string;
  parts: PartData[];
  curriculum: TaskStep[];
}