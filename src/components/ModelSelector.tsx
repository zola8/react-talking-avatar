import { MODELS, type ModelConfig } from '../config/models';


interface ModelSelectorProps {
  selectedId: string;
  onChange: (config: ModelConfig) => void;
}


export default function ModelSelector({ selectedId, onChange }: ModelSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = MODELS.find((m) => m.id === e.target.value);
    if (selected) onChange(selected);
  };

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {MODELS.map((model) => (
        <option key={model.id} value={model.id}>
          {model.label}
        </option>
      ))}
    </select>
  );
}
