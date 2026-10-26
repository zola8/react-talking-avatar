import type { ModelConfig } from '../config/models';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedId: string;
  onChange: (model: ModelConfig) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  models,
  selectedId,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  return (
    <select
      value={selectedId}
      onChange={(e) => {
        const model = models.find((m) => m.id === e.target.value);
        if (model) onChange(model);
      }}
      disabled={disabled}
      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 disabled:opacity-50"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
