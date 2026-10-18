import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import UniversalModel from '../components/UniversalModel';
import ModelSelector from '../components/ModelSelector';
import { MODELS, type ModelConfig } from '../config/models';


export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [faceTexture, setFaceTexture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFaceTexture(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>

        <ModelSelector
          selectedId={selectedModel.id}
          onChange={setSelectedModel}
        />
      </div>

      <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <Canvas camera={{ position: [0, 1.4, 2.4], fov: 35 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <UniversalModel config={selectedModel} faceTextureUrl={faceTexture} />
          <OrbitControls target={[0, 1.1, 0]} />
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
    </div>
  );
}
