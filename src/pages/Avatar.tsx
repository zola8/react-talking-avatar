import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AvatarModel from '../components/AvatarModel';


export default function Avatar() {
  const modelUrl = "/models/Mushy.vrm";

  const [faceTexture, setFaceTexture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFaceTexture(objectUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            {faceTexture ? 'Change Face Photo' : 'Upload Face Photo'}
          </button>
          {faceTexture && (
            <button
              onClick={() => {
                setFaceTexture(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg relative">
        <Canvas camera={{ position: [0, 1.35, 1.5], fov: 30 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />

          <AvatarModel url={modelUrl} faceTextureUrl={faceTexture} />

          <OrbitControls target={[0, 1.35, 0]} />
        </Canvas>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Open your browser's Developer Console (F12).
          When the model loads, it will print the names of all materials it finds.
          Our code automatically looks for materials with "face" or "skin" in the name
          and applies your uploaded photo to them.
        </p>
      </div>
    </div>
  );
}