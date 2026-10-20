import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import ModelSelector from '../components/ModelSelector';
import ResponseArea from '../components/ResponseArea';
import UniversalModel from '../components/UniversalModel';
import VoiceInput from '../components/VoiceInput';
import { MODELS, type ModelConfig } from '../config/models';


export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const controlsRef = useRef<any>(null);

  const handleRefresh = () => {
    setRefreshCount((c) => c + 1);
  };

  const canvasKey = `${selectedModel.id}-${refreshCount}`;

  // Placeholder: will be replaced with real backend call in a future step
  const handleInputSubmit = async (text: string) => {
    setInputText(text);
    setIsResponding(true);
    setResponseText('');

    // Simulate a delayed response
    setTimeout(() => {
      setResponseText(`You said: "${text}"`);
      setIsResponding(false);
    }, 1200);
  };

  const cameraZ = 3.5;
  const cameraY = 1.2;
  const lookAtY = 1.2;

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
            className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            title="Reset camera view"
          >
            Reset View
          </button>
        </div>
      </div>

      <div className="w-full h-[600px] bg-stone-500 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <Canvas
          key={canvasKey}
          camera={{ position: [0, cameraY, cameraZ], fov: 35 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <UniversalModel config={selectedModel} faceTextureUrl={null} />
          <OrbitControls
            ref={controlsRef}
            target={[0, lookAtY, 0]}
            enablePan={true}
            panSpeed={0.5}
            minDistance={1.5}
            maxDistance={8}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>

      <div className="space-y-3">
        <VoiceInput onSubmit={handleInputSubmit} disabled={isResponding} />
        <ResponseArea text={responseText} isLoading={isResponding} />
      </div>
    </div>
  );
}
