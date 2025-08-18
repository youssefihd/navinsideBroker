import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Sélectionner..." }: MultiSelectProps) {
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <span>{selected.length > 0 ? selected.join(", ") : placeholder}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content className="z-50 w-56 rounded-md border bg-white p-2 shadow-md" align="start">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="flex w-full justify-between items-center px-2 py-1 text-sm hover:bg-gray-100 rounded"
            onClick={() => toggleValue(option)}
          >
            <span>{option}</span>
            {selected.includes(option) && <Check className="h-4 w-4 text-blue-500" />}
          </button>
        ))}
      </Popover.Content>
    </Popover.Root>
  );
}
