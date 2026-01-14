import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows, useCursor, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { PartData, ToolType, ModelType } from '../types.ts';
import * as THREE from 'three';
// Fixed Import: Use three-stdlib for reliable access to BufferGeometryUtils in CDN environments
import { mergeBufferGeometries as mergeGeometries } from 'three-stdlib';

const AnimatedGroup = a.group as any;

// 升级材质库 - 实体金属材质 (不透明)
const MATERIALS = {
  castIron: { color: '#334155', roughness: 0.7, metalness: 0.2 },
  steel45: { color: '#f8fafc', roughness: 0.3, metalness: 0.6 },
  bolt: { color: '#e2e8f0', roughness: 0.2, metalness: 0.8 },
  highlight: { valid: '#3b82f6', invalid: '#ef4444', drag: '#eab308', inspect: '#06b6d4' }, // Brighter colors for light bg
  // Engine Materials (Opaque)
  engineGreen: { color: '#059669', roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide }, 
  engineYellow: { color: '#EAB308', roughness: 0.6, metalness: 0.1 }, 
  engineTitanium: { color: '#94a3b8', roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide }, 
  engineFanBlade: { color: '#111827', roughness: 0.2, metalness: 0.6 }, 
  engineInconel: { color: '#78716c', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }, 
  engineSilver: { color: '#cbd5e1', roughness: 0.2, metalness: 0.8 }, 
  combustorInner: { color: '#b45309', roughness: 0.4, metalness: 0.5, emissive: '#c2410c', emissiveIntensity: 0.4 }, 
  combustorHoles: { color: '#451a03', roughness: 0.9, metalness: 0.1 },
  rotorBlade: { color: '#e2e8f0', roughness: 0.3, metalness: 0.7 },
  statorVane: { color: '#64748b', roughness: 0.5, metalness: 0.4 },
  // Turbine Specific
  turbineBladeHot: { color: '#8c7668', roughness: 0.6, metalness: 0.4 }, // Discolored due to heat
  turbineBladeCool: { color: '#a8a29e', roughness: 0.5, metalness: 0.5 },
  turbineDisk: { color: '#57534e', roughness: 0.6, metalness: 0.6 },
};

// --- Helper Functions ---
const getConeRadius = (y: number, rBottom: number, rTop: number, height: number) => {
    const t = (y + height/2) / height;
    return rBottom * (1 - t) + rTop * t;
};

// --- Geometry Generators (Reducer) ---

// HOUSING CONSTANTS - Adjusted to prevent gear clipping
const HOUSING_W = 5.4; // Increased from 5.0 to 5.4 to provide clearance for large gear
const HOUSING_H = 2.0; // Total height of one half
const HOUSING_THICKNESS = 0.3; // 3cm Wall Thickness
const BEARING_X = 1.0; // Offset for shafts
// Precise Bearing Radii to match shafts with clearance
const BEARING_R_INPUT = 0.32;  // Left side (-X) for High Speed Shaft
const BEARING_R_OUTPUT = 0.42; // Right side (+X) for Low Speed Shaft

// Generate the Outer Profile of the housing (The Flange/Wall Shape)
const getHousingProfile = (isUpper: boolean) => {
  const shape = new THREE.Shape();
  
  if (isUpper) {
    // Upper Housing: Positioned at Global Y=1, so Local Y=-1 is the split line (Global Y=0)
    // Range: Local Y from -1 to 1
    
    shape.moveTo(HOUSING_W/2, -1); 
    shape.lineTo(HOUSING_W/2, 1);
    shape.lineTo(-HOUSING_W/2, 1);
    shape.lineTo(-HOUSING_W/2, -1);
    
    // Left Cutout (Input Shaft, x = -1.0) - Arc UP
    shape.lineTo(-BEARING_X - BEARING_R_INPUT, -1);
    shape.absarc(-BEARING_X, -1, BEARING_R_INPUT, Math.PI, 0, true); 
    
    // Right Cutout (Output Shaft, x = 1.0) - Arc UP
    shape.lineTo(BEARING_X - BEARING_R_OUTPUT, -1);
    shape.absarc(BEARING_X, -1, BEARING_R_OUTPUT, Math.PI, 0, true);
    
    shape.lineTo(HOUSING_W/2, -1);
  } else {
    // Lower Housing: Positioned at Global Y=-1, so Local Y=1 is the split line (Global Y=0)
    // Range: Local Y from 1 to -1
    
    shape.moveTo(HOUSING_W/2, 1);
    
    // Right Cutout (Output Shaft, x = 1.0) - Arc DOWN
    shape.lineTo(BEARING_X + BEARING_R_OUTPUT, 1);
    shape.absarc(BEARING_X, 1, BEARING_R_OUTPUT, 0, Math.PI, true);
    
    // Left Cutout (Input Shaft, x = -1.0) - Arc DOWN
    shape.lineTo(-BEARING_X + BEARING_R_INPUT, 1);
    shape.absarc(-BEARING_X, 1, BEARING_R_INPUT, 0, Math.PI, true);
    
    shape.lineTo(-HOUSING_W/2, 1);
    shape.lineTo(-HOUSING_W/2, -1);
    shape.lineTo(HOUSING_W/2, -1);
    shape.lineTo(HOUSING_W/2, 1);
  }
  return shape;
};

// Generate the Void Profile (Inner Hollow Cavity)
const getHousingVoid = (isUpper: boolean) => {
  const path = new THREE.Path();
  const t = HOUSING_THICKNESS;
  
  if (isUpper) {
    // Upper Void
    path.moveTo(HOUSING_W/2 - t, -1);
    path.lineTo(HOUSING_W/2 - t, 1 - t);
    path.lineTo(-(HOUSING_W/2 - t), 1 - t);
    path.lineTo(-(HOUSING_W/2 - t), -1);
    
    path.lineTo(-BEARING_X - BEARING_R_INPUT, -1);
    path.absarc(-BEARING_X, -1, BEARING_R_INPUT, Math.PI, 0, true);
    
    path.lineTo(BEARING_X - BEARING_R_OUTPUT, -1);
    path.absarc(BEARING_X, -1, BEARING_R_OUTPUT, Math.PI, 0, true);
    
    path.lineTo(HOUSING_W/2 - t, -1);
  } else {
    // Lower Void
    path.moveTo(HOUSING_W/2 - t, 1);
    
    path.lineTo(BEARING_X + BEARING_R_OUTPUT, 1);
    path.absarc(BEARING_X, 1, BEARING_R_OUTPUT, 0, Math.PI, true);
    
    path.lineTo(-BEARING_X + BEARING_R_INPUT, 1);
    path.absarc(-BEARING_X, 1, BEARING_R_INPUT, 0, Math.PI, true);
    
    path.lineTo(-(HOUSING_W/2 - t), 1);
    path.lineTo(-(HOUSING_W/2 - t), -1 + t);
    path.lineTo(HOUSING_W/2 - t, -1 + t);
    path.lineTo(HOUSING_W/2 - t, 1);
  }
  return path;
};


// --- Sub Components ---
const HollowHousingBody = ({ isUpper, materialProps, children }: { isUpper: boolean, materialProps: any, children?: React.ReactNode }) => {
  const geometries = useMemo(() => {
    const depth = 3.0; // Total Z length
    const endPlateThickness = 0.2;
    const plateShape = getHousingProfile(isUpper);
    const plateGeo = new THREE.ExtrudeGeometry(plateShape, { steps: 1, depth: endPlateThickness, bevelEnabled: false });

    // 2. Main Shell (The hollow tube in between)
    const shellOuterShape = getHousingProfile(isUpper);
    const shellInnerPath = getHousingVoid(isUpper);
    shellOuterShape.holes.push(shellInnerPath);
    
    const shellLength = depth - (endPlateThickness * 2);
    const shellGeo = new THREE.ExtrudeGeometry(shellOuterShape, { steps: 1, depth: shellLength, bevelEnabled: false });

    return { plateGeo, shellGeo, shellLength, endPlateThickness };
  }, [isUpper]);

  const { plateGeo, shellGeo, endPlateThickness } = geometries;

  return (
    <group>
      {/* Back Plate */}
      <mesh geometry={plateGeo} position={[0, 0, -1.5]} castShadow receiveShadow><meshStandardMaterial {...materialProps} /></mesh>
      
      {/* Middle Shell */}
      <mesh geometry={shellGeo} position={[0, 0, -1.5 + endPlateThickness]} castShadow receiveShadow><meshStandardMaterial {...materialProps} /></mesh>
      
      {/* Front Plate */}
      <mesh geometry={plateGeo} position={[0, 0, 1.5 - endPlateThickness]} castShadow receiveShadow><meshStandardMaterial {...materialProps} /></mesh>
      
      {children}
    </group>
  );
};

const SideFlanges = ({ depth, thickness, holeRadius, materialProps, flip, children }: any) => {
  const geometry = useMemo(() => {
    const leftShape = new THREE.Shape();
    leftShape.moveTo(-2.9, -depth/2); leftShape.lineTo(-2.2, -depth/2); leftShape.lineTo(-2.2, depth/2); leftShape.lineTo(-2.9, depth/2); leftShape.lineTo(-2.9, -depth/2);
    const holeL1 = new THREE.Path(); holeL1.absarc(-2.6, 1.6, holeRadius, 0, Math.PI*2, false); leftShape.holes.push(holeL1);
    const holeL2 = new THREE.Path(); holeL2.absarc(-2.6, -1.6, holeRadius, 0, Math.PI*2, false); leftShape.holes.push(holeL2);
    const rightShape = new THREE.Shape();
    rightShape.moveTo(2.2, -depth/2); rightShape.lineTo(2.9, -depth/2); rightShape.lineTo(2.9, depth/2); rightShape.lineTo(2.2, depth/2); rightShape.lineTo(2.2, -depth/2);
    const holeR1 = new THREE.Path(); holeR1.absarc(2.6, 1.6, holeRadius, 0, Math.PI*2, false); rightShape.holes.push(holeR1);
    const holeR2 = new THREE.Path(); holeR2.absarc(2.6, -1.6, holeRadius, 0, Math.PI*2, false); rightShape.holes.push(holeR2);
    return new THREE.ExtrudeGeometry([leftShape, rightShape], { steps: 1, depth: thickness, bevelEnabled: false });
  }, [depth, thickness, holeRadius]);
  
  return (
    <mesh rotation={[flip ? Math.PI / 2 : -Math.PI / 2, 0, 0]} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...materialProps} />
      {children}
    </mesh>
  );
};

const BearingBoss = ({ radius, thickness = 0.1, width = 0.2, isUpper, materialProps, children }: any) => {
  const geometry = useMemo(() => {
    const inner = radius; const outer = radius + thickness;
    const thetaStart = isUpper ? 0 : Math.PI; const thetaLength = Math.PI;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, thetaStart, thetaStart + thetaLength, false);
    shape.absarc(0, 0, inner, thetaStart + thetaLength, thetaStart, true); 
    return new THREE.ExtrudeGeometry(shape, { steps: 1, depth: width, bevelEnabled: false });
  }, [radius, thickness, width, isUpper]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...materialProps} />
      {children}
    </mesh>
  );
};

// Optimized Gear Mesh with clear tooth profile
const GearMesh = ({ radius, width, teeth, color, holeRadius = 0, isHighlighted = false, highlightColor = 'white', twist = 0 }: any) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const numTeeth = teeth; 
    const outerRadius = radius; 
    // Deepen roots for clearer definition (Dedendum approx 1.25m)
    const rootRadius = radius * 0.82; 
    
    if (teeth === 0) {
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    } else {
        const step = (Math.PI * 2) / numTeeth;
        // Tooth profile parameters for realistic look
        const toothRootWidth = step * 0.45; // Width at root
        const toothTipWidth = step * 0.22; // Width at tip (tapered)
        const toothOffset = (step - toothRootWidth) / 2; // Center tooth in step

        // Start from angle 0 at root radius
        shape.moveTo(Math.cos(0) * rootRadius, Math.sin(0) * rootRadius);

        for (let i = 0; i < numTeeth; i++) {
            const theta = i * step;
            
            // Angles for profile points
            const aRootStart = theta + toothOffset; 
            const aTipStart = theta + toothOffset + (toothRootWidth - toothTipWidth)/2;
            const aTipEnd = theta + toothOffset + (toothRootWidth + toothTipWidth)/2; 
            const aRootEnd = theta + toothOffset + toothRootWidth; 
            const aNextStart = theta + step + toothOffset; // Not used for drawing line, but for logic

            // 1. Draw Gap Floor (Root Circle) from previous tooth end to current tooth start
            // Note: On first iteration, we already moved to 0. 
            // If i=0 and offset>0, we draw from 0 to offset.
            shape.lineTo(Math.cos(aRootStart) * rootRadius, Math.sin(aRootStart) * rootRadius);
            
            // 2. Flank Up (Straight taper implies pressure angle)
            shape.lineTo(Math.cos(aTipStart) * outerRadius, Math.sin(aTipStart) * outerRadius);
            
            // 3. Tip Land (Addendum Circle)
            shape.lineTo(Math.cos(aTipEnd) * outerRadius, Math.sin(aTipEnd) * outerRadius);
            
            // 4. Flank Down
            shape.lineTo(Math.cos(aRootEnd) * rootRadius, Math.sin(aRootEnd) * rootRadius);
        }
        
        // Close the loop back to start
        shape.lineTo(Math.cos(Math.PI*2) * rootRadius, Math.sin(Math.PI*2) * rootRadius);
    }
    
    if (holeRadius > 0) {
        const holePath = new THREE.Path(); holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false); shape.holes.push(holePath);
    }
    
    // Extrusion along Z
    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: width, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
    geo.translate(0, 0, -width / 2);
    
    if (twist !== 0) {
       const positions = geo.attributes.position;
       for (let i = 0; i < positions.count; i++) {
           const x = positions.getX(i);
           const y = positions.getY(i);
           const z = positions.getZ(i);
           const angle = (z / width) * twist;
           const cos = Math.cos(angle); const sin = Math.sin(angle);
           positions.setX(i, x * cos - y * sin);
           positions.setY(i, x * sin + y * cos);
       }
       geo.computeVertexNormals();
    }
    return geo;
  }, [radius, width, teeth, holeRadius, twist]);
  
  const materialProps = { emissive: isHighlighted ? highlightColor : 'black', emissiveIntensity: isHighlighted ? 0.6 : 0 };
  return (
    <group> 
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} flatShading={false} {...materialProps} />
      </mesh>
    </group>
  );
};

// --- ENGINE SPECIFIC COMPONENTS ---

// Helper for Engine Casings (Full Cylindrical View) - Flanges REMOVED for smoother look
const EngineCaseSegment = ({ rStart, rEnd, length, color = '#cbd5e1' }: any) => {
   // Assuming flow along local Y+ direction (Front to Back)
   // Cylinder args: radiusTop (End), radiusBottom (Start), height
   const rTop = rEnd || rStart;
   const rBottom = rStart;

   return (
     <group>
        <mesh castShadow receiveShadow>
            <cylinderGeometry args={[rTop, rBottom, length, 64, 1, true]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4} metalness={0.6} />
        </mesh>
     </group>
   )
}

const FanBlade = ({ count = 24, radius = 2.2, chord = 0.5, color }: any) => {
    return (
        <group>
            {/* Blades distributed around Y axis */}
            {Array.from({ length: count }).map((_, i) => (
                <group key={i} rotation={[0, (i / count) * Math.PI * 2, 0]}>
                    <mesh position={[radius/2, 0, 0]} rotation={[0.4, 0, 0]} castShadow>
                        <boxGeometry args={[radius, chord, 0.05]} />
                        <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
                    </mesh>
                </group>
            ))}
            {/* Spinner Cone */}
            <mesh position={[0, -chord/2, 0]} rotation={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.8, 0.2, 1.2, 32]} />
                <meshStandardMaterial color="#111" roughness={0.2} metalness={0.2} />
            </mesh>
             {/* Spiral Line */}
             <mesh position={[0, -chord/2, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.4, 0.03, 16, 32, Math.PI * 2]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    )
}

const BladeRow = ({ y, innerRadius, outerRadius, count, isStator, color, bladeType = 'compressor' }: any) => {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const chord = (outerRadius * 2 * Math.PI) / count * (bladeType === 'turbine' ? 0.55 : 0.45);
        const thickness = chord * (bladeType === 'turbine' ? 0.2 : 0.15);
        
        if (bladeType === 'turbine') {
             // Turbine airfoil: Cambered
            shape.moveTo(-chord/2, -thickness/3);
            // Suction side (convex)
            shape.bezierCurveTo(
                -chord/4, thickness * 1.5, 
                chord/4, thickness * 1.5, 
                chord/2, -thickness/3
            );
            // Pressure side (concave)
            shape.bezierCurveTo(
                chord/4, thickness * 0.2, 
                -chord/4, thickness * 0.2, 
                -chord/2, -thickness/3
            );
        } else {
            // Compressor airfoil: Teardrop/Ogive
            shape.moveTo(-chord/2, 0);
            shape.quadraticCurveTo(0, thickness, chord/2, 0); 
            shape.quadraticCurveTo(0, -thickness*0.3, -chord/2, 0); 
        }

        const span = outerRadius - innerRadius;
        const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: span, steps: 1, bevelEnabled: false });
        
        bladeGeo.rotateY(Math.PI / 2); // Orient along radial
        
        const twistAngle = isStator ? -0.3 : (bladeType === 'turbine' ? 0.6 : 0.4); // More twist for turbine
        bladeGeo.rotateX(twistAngle);

        bladeGeo.translate(innerRadius, 0, 0);

        const geometries: THREE.BufferGeometry[] = [];
        const angleStep = (Math.PI * 2) / count;
        for(let i=0; i<count; i++) {
            const angle = i * angleStep;
            const instance = bladeGeo.clone();
            instance.rotateY(-angle);
            geometries.push(instance);
        }
        
        // Add a hub/rim geometry to connect the blades
        if (!isStator) {
           const rimGeo = new THREE.CylinderGeometry(innerRadius, innerRadius - 0.05, 0.15, 32);
           rimGeo.rotateZ(Math.PI/2); // Align with Y axis of the parent group (which is engine axis)
           geometries.push(rimGeo);
        }

        if (geometries.length === 0) return new THREE.BufferGeometry();
        
        // FIX: Convert all geometries to non-indexed to ensure compatibility between ExtrudeGeometry and CylinderGeometry
        // This prevents the "All geometries must have compatible attributes" error in mergeGeometries
        const compatibleGeometries = geometries.map(g => g.index ? g.toNonIndexed() : g);
        return mergeGeometries(compatibleGeometries);

    }, [innerRadius, outerRadius, count, isStator, bladeType]);

    return (
        <mesh position={[0, y, 0]} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.7} />
        </mesh>
    );
};

const Combustor = ({ y, outerRadius }: any) => {
    return (
        <group position={[0, y, 0]}>
            {/* Outer Casing - Flanged & Bolted */}
            <EngineCaseSegment rStart={1.55} rEnd={1.55} length={0.8} color={MATERIALS.combustorInner.color} />
            
             {/* Dilution Holes - Visualized as dark patches/geometry */}
             {Array.from({length: 8}).map((_, i) => (
                <group key={`hole-${i}`} rotation={[0, i * Math.PI / 4, 0]}>
                    <mesh position={[1.55, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
                        <meshStandardMaterial {...MATERIALS.combustorHoles} />
                    </mesh>
                    <mesh position={[1.55, -0.15, 0]} rotation={[0, 0, Math.PI/2]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
                        <meshStandardMaterial {...MATERIALS.combustorHoles} />
                    </mesh>
                </group>
             ))}

            {/* Detailed Fuel Injectors */}
            {Array.from({length: 12}).map((_, i) => (
                <group key={`inj-${i}`} rotation={[0, i/12 * Math.PI * 2, 0]}>
                    <group position={[outerRadius - 0.25, 0.35, 0]} rotation={[0, 0, -0.5]}>
                        {/* Feed Arm */}
                        <mesh position={[0, 0.1, 0]}>
                            <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
                        </mesh>
                        {/* Swirler Assembly */}
                        <mesh position={[0, -0.12, 0]}>
                             <cylinderGeometry args={[0.05, 0.03, 0.1, 8]} />
                             <meshStandardMaterial color="#94a3b8" />
                        </mesh>
                         {/* Nozzle Tip */}
                         <mesh position={[0, -0.18, 0]}>
                             <cylinderGeometry args={[0.01, 0.005, 0.05]} />
                             <meshStandardMaterial color="#475569" />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}

// --- Annotation Label ---
const AnnotationLabel = ({ text, show, delay = 0 }: { text: string, show: boolean, delay?: number }) => {
    if (!show) return null;

    return (
        <group position={[0, 0, 0]}>
             <Html zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                <div 
                    style={{
                        position: 'absolute',
                        left: 0, top: 0,
                        opacity: 0,
                        animation: `labelFadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                        animationDelay: `${delay + 100}ms`,
                    }}
                >
                    <style>{`
                        @keyframes labelFadeIn {
                            0% { opacity: 0; transform: translate(-5px, 5px); }
                            100% { opacity: 1; transform: translate(0, 0); }
                        }
                    `}</style>
                    <div style={{
                        position: 'absolute', left: '35px', top: '-52px', color: '#1e293b', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textShadow: '0 1px 2px rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
                    }}>
                        {text}
                    </div>
                </div>
            </Html>
        </group>
    );
};

// --- Interactive Part ---
interface InteractivePartProps {
  part: PartData;
  activeTool: ToolType;
  isRemoved: boolean;
  removedParts: string[]; 
  canInteract: boolean; 
  actionType: 'DISASSEMBLE' | 'ASSEMBLE' | 'INSPECT';
  isAnnotationMode?: boolean;
  partsList: PartData[]; 
  isTargetInInspect: boolean; // New prop for INSPECT mode
  onInteract: (id: string) => void;
  onWrongTool: () => void;
  onHoverChange: (id: string | null, isLocked: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const InteractivePart: React.FC<InteractivePartProps> = ({ 
  part, activeTool, isRemoved, removedParts, canInteract, actionType, isAnnotationMode, partsList, isTargetInInspect, onInteract, onWrongTool, onHoverChange, onDragStart, onDragEnd
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  const homePos = part.position;
  const explodedPos = part.explodedPosition || [part.position[0], part.position[1] + 3, part.position[2]];
  
  let targetPos = homePos;
  let targetRot = part.rotation;

  // Modified Logic for Annotation Mode to support 3D offsets
  if (isAnnotationMode) {
      if (part.annotationOffset) {
         // Apply 3D offset if available
         targetPos = [
             part.position[0] + part.annotationOffset[0],
             part.position[1] + part.annotationOffset[1],
             part.position[2] + part.annotationOffset[2]
         ];
      } else {
         // Fallback to simple height offset
         targetPos = [part.position[0], part.position[1] + (part.annotationHeight || 0), part.position[2]];
      }
      targetRot = part.rotation;
  } else if (isRemoved) {
      targetPos = explodedPos;
      targetRot = part.explodedRotation || part.rotation;
  }

  const requiredTool = actionType === 'ASSEMBLE' ? (part.assemblyTool || part.requiredTool) : part.requiredTool;
  const animDelay = isAnnotationMode ? Math.max(0, (6.0 - Math.abs(part.annotationHeight || 0)) * 100) : 0;

  const [{ position, rotation, scale }, api] = useSpring(() => ({
    position: targetPos,
    rotation: targetRot,
    scale: part.scale,
    config: { mass: 1, tension: 120, friction: 26 }
  }));

  useEffect(() => {
    if (!isDragging) {
      let springConfig = { mass: 1, tension: 120, friction: 26 };
      if (isAnnotationMode) springConfig = { mass: 3, tension: 50, friction: 50 }; 
      else if (!isRemoved) springConfig = { mass: 1, tension: 180, friction: 12 };
      else springConfig = { mass: 3, tension: 60, friction: 26 };
      api.start({ position: targetPos as any, rotation: targetRot as any, config: springConfig, delay: isAnnotationMode ? animDelay : 0 });
    }
  }, [isRemoved, isDragging, api, targetPos, targetRot, isAnnotationMode, animDelay]);

  useEffect(() => {
    // Pulse animation for Inspect Target
    if (actionType === 'INSPECT' && isTargetInInspect) {
        api.start({ 
            scale: [part.scale[0] * 1.02, part.scale[1] * 1.02, part.scale[2] * 1.02], 
            config: { duration: 1000 },
            loop: { reverse: true } 
        });
        return; 
    }

    if (canInteract && hovered && !isDragging && !isAnnotationMode) {
        api.start({ scale: [part.scale[0] * 1.05, part.scale[1] * 1.05, part.scale[2] * 1.05] });
    } else {
        api.start({ scale: part.scale, loop: false }); // Reset loop when not inspecting
    }
  }, [canInteract, hovered, isDragging, part.scale, api, isAnnotationMode, actionType, isTargetInInspect]);

  useFrame(() => {
    if (isDragging && actionType === 'ASSEMBLE' && !isAnnotationMode) {
      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z * 0.8;
      const newPos = camera.position.clone().add(dir.multiplyScalar(Math.abs(distance)));
      api.set({ position: [newPos.x, newPos.y, newPos.z] });
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isAnnotationMode) return; 
    e.stopPropagation();

    if (actionType === 'INSPECT') {
        // Just show name on click, no interaction
        onInteract(part.id); 
        return;
    }

    if (actionType === 'DISASSEMBLE') {
        if (!isRemoved && canInteract) {
            if (activeTool === requiredTool) onInteract(part.id);
            else onWrongTool();
        }
    }
    if (actionType === 'ASSEMBLE') {
        if (isRemoved && canInteract) {
             if (activeTool === requiredTool) {
                setIsDragging(true); onDragStart(); (e.target as any).setPointerCapture(e.pointerId);
            } else onWrongTool();
        }
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation(); setIsDragging(false); onDragEnd(); (e.target as any).releasePointerCapture(e.pointerId);
      if (groupRef.current) {
          const currentPos = new THREE.Vector3(groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z);
          const validSlots = partsList.filter(p => removedParts.includes(p.id) && p.type === part.type && p.requiredTool === part.requiredTool);
          let bestSlotId = null; let minDistance = 3.5;
          for (const slot of validSlots) {
              const slotPos = new THREE.Vector3(...slot.position); const dist = currentPos.distanceTo(slotPos);
              if (dist < minDistance) { minDistance = dist; bestSlotId = slot.id; }
          }
          if (bestSlotId) onInteract(bestSlotId);
      }
    }
  };

  useCursor(hovered && !isAnnotationMode, canInteract && actionType !== 'INSPECT' ? (actionType === 'ASSEMBLE' && isRemoved ? 'grab' : 'pointer') : 'auto');

  const highlightStatus = useMemo(() => {
    if (isAnnotationMode) return null;
    
    // Inspect Mode Logic
    if (actionType === 'INSPECT') {
        if (isTargetInInspect) return { color: MATERIALS.highlight.inspect, intensity: 0.6 };
        if (hovered) return { color: MATERIALS.highlight.valid, intensity: 0.2 };
        return null; // Make others normal
    }

    if (isDragging) return { color: MATERIALS.highlight.drag };
    if (actionType === 'DISASSEMBLE') {
        if (isRemoved) return null;
        if (!canInteract) return hovered ? { color: MATERIALS.highlight.invalid } : null;
        if (!hovered) return null;
        if (activeTool !== ToolType.NONE && activeTool !== requiredTool) return { color: MATERIALS.highlight.invalid };
        return { color: MATERIALS.highlight.valid };
    } else {
        if (!isRemoved) return null;
        if (!canInteract) return hovered ? { color: MATERIALS.highlight.invalid } : null;
        if (!hovered) return { color: MATERIALS.highlight.valid, intensity: 0.2 }; 
        if (activeTool !== ToolType.NONE && activeTool !== requiredTool) return { color: MATERIALS.highlight.invalid };
        return { color: MATERIALS.highlight.valid };
    }
  }, [isRemoved, canInteract, hovered, activeTool, requiredTool, actionType, isDragging, isAnnotationMode, isTargetInInspect]);

  const commonMatProps = {
    emissive: highlightStatus ? highlightStatus.color : 'black',
    emissiveIntensity: highlightStatus ? (highlightStatus.intensity || 0.5) : 0
  };

  const renderGeometry = () => {
    switch(part.type) {
      case 'bolt': return (<group><mesh position={[0, -0.175, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.35, 16]} /><meshStandardMaterial {...MATERIALS.bolt} {...commonMatProps} /></mesh><mesh position={[0, 0.04, 0]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.08, 6]} /><meshStandardMaterial {...MATERIALS.bolt} {...commonMatProps} /></mesh></group>);
      case 'obs_cover': return (<group><mesh castShadow receiveShadow><boxGeometry args={[1.5, 0.1, 1]} /><meshStandardMaterial color={part.color} roughness={0.4} metalness={0.5} {...commonMatProps} /></mesh><mesh position={[-0.6, 0, 0.35]} castShadow> <cylinderGeometry args={[0.035, 0.035, 0.11, 8]} /> <meshStandardMaterial color="#222" /> </mesh><mesh position={[0.6, 0, 0.35]} castShadow> <cylinderGeometry args={[0.035, 0.035, 0.11, 8]} /> <meshStandardMaterial color="#222" /> </mesh><mesh position={[-0.6, 0, -0.35]} castShadow> <cylinderGeometry args={[0.035, 0.035, 0.11, 8]} /> <meshStandardMaterial color="#222" /> </mesh><mesh position={[0.6, 0, -0.35]} castShadow> <cylinderGeometry args={[0.035, 0.035, 0.11, 8]} /> <meshStandardMaterial color="#222" /> </mesh></group>);
      case 'cover': return (<group><HollowHousingBody isUpper={true} materialProps={{...MATERIALS.castIron, ...commonMatProps}}></HollowHousingBody><group position={[0, -1.0, 0]}> <SideFlanges depth={3.6} thickness={0.1} holeRadius={0.06} materialProps={{...MATERIALS.castIron, ...commonMatProps}}></SideFlanges></group></group>);
      case 'housing': return (
        <group>
            <HollowHousingBody isUpper={false} materialProps={{...MATERIALS.castIron, ...commonMatProps}} />
            <group position={[0, 1.0, 0]}>
                <SideFlanges depth={3.6} thickness={0.1} holeRadius={0.06} materialProps={{...MATERIALS.castIron, ...commonMatProps}} flip={true} />
            </group>
            <group position={[-1.0, 1.0, 0]}>
                <BearingBoss radius={0.32} width={0.2} isUpper={false} materialProps={{...MATERIALS.castIron, ...commonMatProps}} />
            </group>
            <group position={[1.0, 1.0, 0]}>
                <BearingBoss radius={0.42} width={0.2} isUpper={false} materialProps={{...MATERIALS.castIron, ...commonMatProps}} />
            </group>
            <group position={[0, -0.9, 0]}>
                <mesh position={[-2.2, 0, 1.2]} castShadow receiveShadow><boxGeometry args={[1.2, 0.2, 0.6]} /><meshStandardMaterial {...MATERIALS.castIron} {...commonMatProps} /></mesh>
                <mesh position={[2.2, 0, 1.2]} castShadow receiveShadow><boxGeometry args={[1.2, 0.2, 0.6]} /><meshStandardMaterial {...MATERIALS.castIron} {...commonMatProps} /></mesh>
                <mesh position={[-2.2, 0, -1.2]} castShadow receiveShadow><boxGeometry args={[1.2, 0.2, 0.6]} /><meshStandardMaterial {...MATERIALS.castIron} {...commonMatProps} /></mesh>
                <mesh position={[2.2, 0, -1.2]} castShadow receiveShadow><boxGeometry args={[1.2, 0.2, 0.6]} /><meshStandardMaterial {...MATERIALS.castIron} {...commonMatProps} /></mesh>
            </group>
        </group>
      );
      case 'shaft': return (<group rotation={[Math.PI/2, 0, 0]}><mesh castShadow receiveShadow><cylinderGeometry args={[0.2, 0.2, 3.36, 32]} /><meshStandardMaterial {...MATERIALS.steel45} {...commonMatProps} /></mesh><group position={[0, 0.5, 0]} rotation={[-Math.PI/2, 0, 0]}><GearMesh radius={0.75} width={0.8} teeth={19} color="#94a3b8" isHighlighted={!!highlightStatus} highlightColor={highlightStatus?.color} /></group><mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.3, 32]} /><meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} {...commonMatProps} /></mesh><mesh position={[0, -1.4, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.3, 32]} /><meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} {...commonMatProps} /></mesh></group>);
      case 'gear': return (<group rotation={[Math.PI/2, 0, 0]}><mesh castShadow receiveShadow><cylinderGeometry args={[0.35, 0.35, 3.36, 32]} /><meshStandardMaterial {...MATERIALS.steel45} {...commonMatProps} /></mesh><group position={[0, 0.5, 0]} rotation={[-Math.PI/2, 0, 0]}><GearMesh radius={1.2} width={0.7} teeth={36} color="#64748b" holeRadius={0.35} isHighlighted={!!highlightStatus} highlightColor={highlightStatus?.color} /></group><mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.3, 32]} /><meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} {...commonMatProps} /></mesh><mesh position={[0, -1.4, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.3, 32]} /><meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} {...commonMatProps} /></mesh></group>);
      case 'engine_fan_case': return (<group><mesh castShadow receiveShadow><cylinderGeometry args={[2.4, 2.4, 2.0, 64, 1, true]} /><meshStandardMaterial {...MATERIALS.engineTitanium} side={THREE.DoubleSide} {...commonMatProps} /></mesh><mesh castShadow receiveShadow><cylinderGeometry args={[2.3, 2.3, 2.0, 64, 1, true]} /> <meshStandardMaterial color="#333" side={THREE.DoubleSide} {...commonMatProps} /></mesh><mesh position={[0, -1.0, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[2.35, 0.05, 16, 64]} /><meshStandardMaterial color="#d1d5db" roughness={0.1} metalness={0.9} /></mesh></group>);
      case 'engine_fan_rotor': return (<group position={[0, -0.3, 0]}><FanBlade count={20} radius={2.2} chord={0.8} color={MATERIALS.engineFanBlade.color} /></group>);
      
      case 'engine_lpc': return (
        <group>
           {/* Booster Spool Drum */}
           <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]} castShadow>
               <cylinderGeometry args={[0.9, 1.0, 0.8, 32]} />
               <meshStandardMaterial {...MATERIALS.engineTitanium} {...commonMatProps} />
           </mesh>
           
           {/* Outer Casing - Matches Fan Case Rear and IPC Front */}
           <EngineCaseSegment rStart={1.75} rEnd={1.7} length={0.8} color={MATERIALS.engineTitanium.color} />

           {/* Stage 1 - 3 */}
           <BladeRow y={-0.2} innerRadius={1.0} outerRadius={1.65} count={30} isStator={false} color={MATERIALS.rotorBlade.color} />
           <BladeRow y={0.0} innerRadius={0.95} outerRadius={1.65} count={30} isStator={true} color={MATERIALS.statorVane.color} />
           <BladeRow y={0.2} innerRadius={0.9} outerRadius={1.65} count={30} isStator={false} color={MATERIALS.rotorBlade.color} />
        </group>
      );

      case 'engine_ipc': return (
        <group>
            {/* Using EngineCaseSegment for consistent look */}
            <EngineCaseSegment rStart={1.7} rEnd={1.7} length={0.6} color="#64748b" />
            
            {/* Ribs */}
            {[0, 1, 2, 3, 4, 5].map(i => (<mesh key={i} rotation={[0, i * Math.PI / 3, 0]} position={[0, 0, 0]}><boxGeometry args={[3.2, 0.3, 0.1]} /><meshStandardMaterial color="#475569" /></mesh>))}
            <mesh><cylinderGeometry args={[0.5, 0.5, 0.6, 16]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
      );
      
      case 'engine_hpc': return (
        <group>
            {/* Outer Casing - Tapers from IPC (1.7) to Combustor (1.55) */}
            <EngineCaseSegment rStart={1.7} rEnd={1.55} length={1.5} color={MATERIALS.engineTitanium.color} />

            {/* Core Drum Construction */}
            {/* Stage 1-4 Rotors with distinct disks */}
            {[-0.6, -0.2, 0.2, 0.6].map((y, i) => { 
                const drumR = getConeRadius(y, 1.2, 1.0, 1.6);
                const bladeR = getConeRadius(y, 1.7, 1.3, 1.6);
                return (
                    <group key={i}>
                        {/* Rotor Disk */}
                        <mesh position={[0, y, 0]} castShadow>
                            <cylinderGeometry args={[drumR, drumR, 0.2, 32]} />
                            <meshStandardMaterial {...MATERIALS.engineGreen} {...commonMatProps} />
                        </mesh>
                        <BladeRow y={y} innerRadius={drumR} outerRadius={bladeR-0.05} count={40 - i*2} isStator={false} color={MATERIALS.rotorBlade.color} />
                        {/* Stator Vane Ring (Floating in this view) */}
                        {i < 3 && <BladeRow y={y+0.2} innerRadius={drumR+0.05} outerRadius={bladeR-0.08} count={40} isStator={true} color={MATERIALS.statorVane.color} />}
                    </group>
                )
            })}
             {/* Central Shaft tie */}
             <mesh position={[0, 0, 0]}>
                 <cylinderGeometry args={[0.6, 0.6, 1.5, 16]} />
                 <meshStandardMaterial color="#333" />
             </mesh>
        </group>
      );
      
      case 'engine_combustor': return (<group><Combustor y={0} outerRadius={1.0} /></group>);
      
      case 'engine_hpt': return (
        <group>
            {/* Outer Casing - Matches Combustor (1.55) to LPT (1.6) */}
            <EngineCaseSegment rStart={1.55} rEnd={1.6} length={0.5} color={MATERIALS.engineInconel.color} />

            {/* High Pressure Turbine Single Stage with detailed Disk */}
            <mesh position={[0, 0, 0]} castShadow>
                 {/* Massive Disk Hub */}
                 <cylinderGeometry args={[0.8, 0.8, 0.3, 32]} />
                 <meshStandardMaterial {...MATERIALS.turbineDisk} {...commonMatProps} />
            </mesh>
            {/* Blade Platform */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.85, 0.85, 0.15, 32]} />
                 <meshStandardMaterial color="#78716c" />
            </mesh>
            <BladeRow y={0} innerRadius={0.8} outerRadius={1.38} count={42} isStator={false} color={MATERIALS.turbineBladeHot.color} bladeType="turbine" />
            {/* Locking Plate / Cooling Cover */}
            <mesh position={[0, 0.16, 0]}>
                 <cylinderGeometry args={[0.6, 0.6, 0.05, 32]} />
                 <meshStandardMaterial color="#a8a29e" roughness={0.3} />
            </mesh>
        </group>
      );
      
      case 'engine_lpt': return (
        <group>
             {/* Outer Casing - Tapers from HPT (1.6) to Nozzle (1.4) */}
             <EngineCaseSegment rStart={1.6} rEnd={1.4} length={1.4} color={MATERIALS.engineInconel.color} />

             {/* Low Pressure Turbine Multi-Stage */}
             {/* Central Shaft/Drum */}
             <mesh position={[0, 0, 0]}>
                 <cylinderGeometry args={[0.7, 0.8, 1.2, 32]} />
                 <meshStandardMaterial {...MATERIALS.engineInconel} {...commonMatProps} />
             </mesh>
             {/* 3 Stages */}
             {[-0.4, 0, 0.4].map((y, i) => (
                 <group key={i}>
                     {/* Disk Ridge */}
                     <mesh position={[0, y, 0]}>
                         <cylinderGeometry args={[0.75 + (i*0.05), 0.75 + (i*0.05), 0.15, 32]} />
                         <meshStandardMaterial {...MATERIALS.turbineDisk} {...commonMatProps} />
                     </mesh>
                     <BladeRow y={y} innerRadius={0.75 + (i*0.05)} outerRadius={1.48} count={32} isStator={false} color={MATERIALS.turbineBladeCool.color} bladeType="turbine" />
                 </group>
             ))}
        </group>
      );

      case 'engine_nozzle': return (<group><mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0, 0.5, 1.5, 32]} /><meshStandardMaterial color="#333" roughness={0.9} /></mesh><mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.8, 1.8, 32]} /><meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.2} {...commonMatProps} /></mesh><mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[1.1, 1.4, 1.0, 48, 1, true]} /><meshStandardMaterial {...MATERIALS.engineInconel} side={THREE.DoubleSide} {...commonMatProps} /></mesh></group>);
      // Fixed Gearbox Geometry: Better placement and visual connection to engine core
      case 'engine_gearbox': return (
        <group>
            {/* Main Accessory Gearbox Housing - Moved slightly down to avoid clip */}
            <mesh position={[0, -0.7, 0]} castShadow>
                <boxGeometry args={[1.2, 0.6, 0.8]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} {...commonMatProps} />
            </mesh>
            {/* Radial Drive Shaft Housing - Visual connection to core */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
             {/* Accessory Units (Pump, Generator) */}
            <mesh position={[0, -0.7, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
                <meshStandardMaterial color="#d4d4d8" />
            </mesh>
            <mesh position={[0.4, -0.7, -0.5]} rotation={[Math.PI/2, 0, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
      );
      // Fixed Pipe Geometry: Hugs the core, avoids Fan Case (R=2.4)
      case 'engine_pipe': return (
        <group>
             {/* Main Fuel Manifold - Running along the top of Core (R~1.6) but starting AFTER Fan Case */}
             {/* Local X=0 is engine center. Local Y is Engine Length. */}
             {/* Position radial offset to 1.75 to sit on HPC/Combustor */}
             <group position={[1.75, 0.5, 0]}> 
                <mesh castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 4.5]} />
                    <meshStandardMaterial {...MATERIALS.engineSilver} {...commonMatProps} />
                </mesh>
                {/* Branch lines to injectors */}
                {[0, 0.5, 1.0, -0.5].map((y, i) => (
                    <mesh key={i} position={[-0.2, y, 0]} rotation={[0, 0, Math.PI/2]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                        <meshStandardMaterial {...MATERIALS.engineSilver} />
                    </mesh>
                ))}
             </group>

             {/* Clamps/Rings around the core sections */}
             <mesh position={[0, -0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[1.68, 0.03, 8, 48, Math.PI]} /> 
                <meshStandardMaterial {...MATERIALS.engineSilver} {...commonMatProps} />
            </mesh>
            <mesh position={[0, 1.5, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[1.55, 0.03, 8, 48]} />
                <meshStandardMaterial {...MATERIALS.engineSilver} {...commonMatProps} />
            </mesh>
        </group>
      );
      case 'engine_stand': return (
        <group>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.0, 0.4, 3.2]} />
            <meshStandardMaterial {...MATERIALS.engineYellow} />
          </mesh>
          {[[-2.8, -0.3, 1.4], [-2.8, -0.3, -1.4], [2.8, -0.3, 1.4], [2.8, -0.3, -1.4]].map((pos, i) => (
            <group key={i} position={pos as any}>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.25, 0.4, 0.25]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            </group>
          ))}
          <group position={[-2.35, 0, 0]}>
            {/* Front Support - Widen base and increase radius */}
            <mesh position={[0, 0.825, 0]}>
              <boxGeometry args={[0.6, 0.85, 3.0]} />
              <meshStandardMaterial {...MATERIALS.engineYellow} />
            </mesh>
            <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[2.5, 2.5, 0.6, 32, 1, true, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#374151" side={THREE.DoubleSide} />
            </mesh>
            {/* Padding */}
             <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[2.51, 2.51, 0.5, 32, 1, true, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
            </mesh>
          </group>
          <group position={[2.35, 0, 0]}>
            <mesh position={[0, 1.075, 0]}>
              <boxGeometry args={[0.6, 1.35, 1.8]} />
              <meshStandardMaterial {...MATERIALS.engineYellow} />
            </mesh>
            <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[1.75, 1.75, 0.6, 32, 1, true, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#374151" side={THREE.DoubleSide} />
            </mesh>
             <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[1.76, 1.76, 0.5, 32, 1, true, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      );
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <AnimatedGroup ref={groupRef} position={position as any} rotation={rotation as any} scale={scale as any} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); onHoverChange(part.id, false); }} onPointerOut={(e: any) => { setHovered(false); onHoverChange(null, false); }}>
      {renderGeometry()}
      <AnnotationLabel text={part.name} show={isAnnotationMode === true} delay={animDelay} />
      
      {/* New: Hover Tooltip */}
      {!isAnnotationMode && hovered && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
           <div className="px-3 py-1.5 bg-slate-900/90 border border-blue-500/30 rounded text-xs text-blue-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap font-bold backdrop-blur-md">
             {part.name}
           </div>
        </Html>
      )}
    </AnimatedGroup>
  );
};

// --- Camera Rig Component for Smooth Transitions ---
const CameraRig = ({ modelType }: { modelType: ModelType }) => {
    const { camera } = useThree();
    const isEngine = modelType === 'ENGINE';
    
    // Target camera positions and lookAt points
    const targetPos = useMemo(() => isEngine ? new THREE.Vector3(8, 5, 8) : new THREE.Vector3(5, 4, 5), [isEngine]);
    const targetLookAt = useMemo(() => isEngine ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 0), [isEngine]);

    useEffect(() => {
        // Set initial position when model changes.
        // We use useEffect instead of useFrame to allow OrbitControls to take over afterwards.
        camera.position.copy(targetPos);
        camera.lookAt(targetLookAt);
    }, [modelType, targetPos, targetLookAt, camera]);

    return null;
}

interface ThreeSceneProps {
  parts: PartData[];
  activeTool: ToolType;
  removedParts: string[];
  onPartInteract: (id: string) => void;
  onWrongTool: () => void;
  currentActionType: 'DISASSEMBLE' | 'ASSEMBLE' | 'INSPECT';
  targetPartIds: string[];
  isAnnotationMode: boolean;
  modelType: ModelType;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  parts,
  activeTool,
  removedParts,
  onPartInteract,
  onWrongTool,
  currentActionType,
  targetPartIds,
  isAnnotationMode,
  modelType
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate dynamic floor height based on model type
  const floorHeight = modelType === 'ENGINE' ? -3.5 : -1.5;

  // Calculate OrbitControls target based on model type to ensure correct center of rotation
  const controlsTarget = useMemo(() => (modelType === 'ENGINE' ? [1, 0, 0] : [0, 0, 0]) as [number, number, number], [modelType]);

  return (
    <div className="w-full h-full bg-slate-200 relative">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} camera={{ position: [5, 4, 5], fov: 45 }}>
        <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={50} />
        <CameraRig modelType={modelType} />
        
        <OrbitControls 
            minDistance={2} 
            maxDistance={25} 
            enablePan={true}
            enabled={!isDragging}
            target={controlsTarget}
        />
        
        {/* Replaced failing preset="city" with procedural environment */}
        <Environment resolution={256}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                {/* Ceiling Light for main reflection */}
                <mesh position={[0, 10, 0]} scale={[20, 20, 1]}>
                    <planeGeometry />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
                {/* Side Lights for contour */}
                <mesh position={[10, 0, 5]} rotation={[0, -Math.PI / 4, 0]} scale={[10, 20, 1]}>
                    <planeGeometry />
                    <meshBasicMaterial color="#e2e8f0" toneMapped={false} />
                </mesh>
                <mesh position={[-10, 0, 5]} rotation={[0, Math.PI / 4, 0]} scale={[10, 20, 1]}>
                    <planeGeometry />
                    <meshBasicMaterial color="#cbd5e1" toneMapped={false} />
                </mesh>
            </group>
        </Environment>

        <ambientLight intensity={0.6} />
        <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
        >
            <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 50]} />
        </directionalLight>

        <group position={[0, -0.5, 0]}>
            {parts.map((part) => {
                const isRemoved = removedParts.includes(part.id);
                // Basic dependency check for disassembly
                const dependencyMet = !part.dependencyId || removedParts.includes(part.dependencyId);
                
                let canInteract = false;
                if (currentActionType === 'INSPECT') {
                   canInteract = true; 
                } else if (currentActionType === 'DISASSEMBLE') {
                    // Can disassemble if NOT removed, dependency is met, and is a target for this step
                    canInteract = !isRemoved && dependencyMet && targetPartIds.includes(part.id);
                } else {
                    // ASSEMBLE: Can assemble if it IS removed and is a target.
                    canInteract = isRemoved && targetPartIds.includes(part.id);
                }

                const isTarget = targetPartIds.includes(part.id);

                return (
                    <InteractivePart
                        key={part.id}
                        part={part}
                        activeTool={activeTool}
                        isRemoved={isRemoved}
                        removedParts={removedParts}
                        canInteract={canInteract}
                        actionType={currentActionType}
                        isAnnotationMode={isAnnotationMode}
                        partsList={parts}
                        isTargetInInspect={currentActionType === 'INSPECT' && isTarget}
                        onInteract={onPartInteract}
                        onWrongTool={onWrongTool}
                        onHoverChange={(id, locked) => setHoveredId(id)}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setIsDragging(false)}
                    />
                );
            })}
        </group>

        {/* Dynamic floor height adjustment */}
        <ContactShadows position={[0, floorHeight, 0]} opacity={0.4} scale={25} blur={2.5} far={4.5} />
        <Grid 
            position={[0, floorHeight - 0.01, 0]} 
            args={[30, 30]} 
            cellSize={1} 
            cellThickness={1} 
            cellColor="#cbd5e1" 
            sectionSize={5} 
            sectionThickness={1.5} 
            sectionColor="#94a3b8" 
            fadeDistance={30} 
            infiniteGrid 
        />
      </Canvas>
    </div>
  );
};