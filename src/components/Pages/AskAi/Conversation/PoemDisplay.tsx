import React from 'react';
import { useFormatPoem } from './useFormatPoem';

interface PoemDisplayProps {
  content: string;
}

const PoemDisplay: React.FC<PoemDisplayProps> = ({ content }) => {
  const poem = useFormatPoem(content);
  
  if (!poem) {
    // Regular markdown content, not a poem
    return null;
  }
  
  return (
    <div className="poem-display overflow-hidden w-full"> {/* Added overflow control */}
      {/* Title Section */}
      <div className="poem-title mb-6">
        <h2 className="text-2xl font-bold break-words">{poem.title.chinese}</h2>
        <p className="text-lg text-gray-300 break-words">{poem.title.pinyin}</p>
        <p className="text-md text-gray-400 break-words">{poem.title.english}</p>
      </div>
      
      {/* Lines Section */}
      <div className="poem-lines mb-8">
        <h3 className="text-xl font-semibold mb-4">诗句 / Lines</h3>
        {poem.lines.map((line, index) => (
          <div key={index} className="poem-line mb-6">
            <p className="text-lg font-bold break-words">{index + 1}. {line.original}</p>
            <p className="text-md break-words">
              <span className="text-gray-300">{line.pinyin}</span>
              <span className="ml-2 text-gray-400">
                {line.toneColors.map((tone, i) => (
                  <span key={i} style={{ color: tone.color }} className="mx-1">
                    {tone.emoji}
                  </span>
                ))}
              </span>
            </p>
            <p className="text-gray-400 break-words">Literal: {line.literal}</p>
            <p className="text-gray-300 break-words">Poetic EN: {line.poetic}</p>
            <p className="break-words">诗意中文解释: {line.chinese}</p>
          </div>
        ))}
      </div>
      
      {/* Analysis Section */}
      <div className="poem-analysis mb-8">
        <h3 className="text-xl font-semibold mb-4">诗歌解析</h3>
        
        {/* Line by line analysis */}
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">逐句解释 🎨</h4>
          <ul className="list-disc pl-6">
            {poem.analysis.lineByLine.map((analysis, index) => (
              <li key={index} className="break-words">{analysis}</li>
            ))}
          </ul>
        </div>
        
        {/* Historical background */}
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">历史背景 🏯</h4>
          <p className="break-words">{poem.analysis.historical}</p>
        </div>
        
        {/* Literary techniques */}
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">文学手法 🖌️</h4>
          <ul className="list-disc pl-6">
            {poem.analysis.literary.map((technique, index) => (
              <li key={index} className="break-words">{technique}</li>
            ))}
          </ul>
        </div>
        
        {/* Vocabulary */}
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">生词解析 📚</h4>
          <ul className="list-disc pl-6">
            {poem.analysis.vocabulary.map((word, index) => (
              <li key={index} className="break-words">
                <strong>{word.word} ({word.pinyin})</strong>: {word.meaning}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Cultural Section */}
      <div className="poem-cultural">
        <h3 className="text-xl font-semibold mb-4">Cultural & Modern Relevance 🌐</h3>
        <ol className="list-decimal pl-6">
          {poem.cultural.map((point, index) => (
            <li key={index} className="mb-2 break-words">{point}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default React.memo(PoemDisplay);