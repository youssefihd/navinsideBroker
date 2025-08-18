import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function AutocompleteInput({
  label,
  value,
  onChange,
  onInputChange,
  onCreate,
  suggestions = [],
  placeholder = "",
}) {
  const [inputText, setInputText] = useState(value?.label || "");
  const [hasSelected, setHasSelected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (hasSelected) {
      setHasSelected(false);
    } else {
      setInputText(value?.label || "");
    }
  }, [value]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setInputText(inputValue);
    setShowSuggestions(true);
    onInputChange?.(inputValue); // Send raw text to parent
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputText(suggestion.label);
    setHasSelected(true);
    setShowSuggestions(false);
    onChange(suggestion);
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(inputText.toLowerCase())
  );

  const allowCreate =
    onCreate &&
    inputText &&
    !filteredSuggestions.some(
      (s) => s.label.toLowerCase() === inputText.toLowerCase()
    );

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
      {showSuggestions && inputText && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded max-h-40 overflow-y-auto shadow">
          {filteredSuggestions.map((s) => (
            <li
              key={s.id}
              onMouseDown={() => handleSelectSuggestion(s)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {s.label}
            </li>
          ))}
          {allowCreate && (
            <li
              onMouseDown={() => {
                onCreate(inputText);
                setShowSuggestions(false);
              }}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer font-semibold text-blue-700"
            >
              ➕ Create "{inputText}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
