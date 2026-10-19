import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import ModelSelector from '../components/ModelSelector';
import UniversalModel from '../components/UniversalModel';
import { MODELS, type ModelConfig } from '../config/models';


export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [faceTexture, setFaceTexture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFaceTexture(URL.createObjectURL(file));
  };

  const handleRefresh = () => {
    // reset the camera. No Canvas remount needed.
    controlsRef.current?.reset();
  };

  // Camera: stable Z, Y follows the model's yOffset so the camera lifts with the model.
  const cameraZ = 3.5;
  const cameraY = 1.5 + (selectedModel.yOffset ?? 0);
  const lookAtY = 1.2 + (selectedModel.yOffset ?? 0);

  // Canvas only remounts on model switch, not on refresh.
  const canvasKey = selectedModel.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>

        <div className="flex items-center gap-3">
          <ModelSelector
            selectedId={selectedModel.id}
            onChange={setSelectedModel}
          />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            title="Reset camera view"
          >
            Reset View
          </button>
        </div>
      </div>

      <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <Canvas
          key={canvasKey}
          camera={{ position: [0, cameraY, cameraZ], fov: 35 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <UniversalModel config={selectedModel} faceTextureUrl={faceTexture} />
          <OrbitControls
            ref={controlsRef}
            target={[0, lookAtY, 0]}
            enablePan={false}
            minDistance={1.5}
            maxDistance={8}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {faceTexture ? 'Photo attached' : 'Upload Face Photo'}
        </button>
        <p className="text-sm text-gray-500">
          Photo mapping lands in a future step.
        </p>
      </div>
    </div>
  );
}
