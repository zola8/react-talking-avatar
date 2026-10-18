import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import ModelSelector from '../components/ModelSelector';
import UniversalModel from '../components/UniversalModel';
import { MODELS, type ModelConfig } from '../config/models';


export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [faceTexture, setFaceTexture] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFaceTexture(URL.createObjectURL(file));
  };

  const handleRefresh = () => {
    setCanvasKey((prev) => prev + 1);
  };

  // Calculate camera position based on model offsets
  const baseZ = 3.5;
  const cameraZ = baseZ - (selectedModel.zoomAdjust ?? 0);
  const cameraY = 1.5 + (selectedModel.yOffset ?? 0);

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
            title="Refresh 3D view"
          >
            Refresh
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
          <OrbitControls target={[0, 1.2, 0]} />
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
          Photo mapping lands in a future step. For now it only confirms the pipeline works (check console).
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> If the display looks wrong after switching models, click "Refresh" to force a clean reload.
        </p>
      </div>
    </div>
  );
}
