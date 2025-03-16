import { TSuggestion } from "@/types/homepage/input";
import React from "react";

type SuggestionListProps = {
  suggestions: TSuggestion[];
  onSuggestionClick: (suggestion: string) => void;
};

const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  onSuggestionClick,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSuggestionClick(suggestion.text)}
          className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
};

export default SuggestionList;
