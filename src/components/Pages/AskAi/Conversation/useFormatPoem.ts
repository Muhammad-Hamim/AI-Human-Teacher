import { useMemo } from 'react';

interface ToneColor {
  emoji: string;
  color: string;
}

interface FormattedLine {
  original: string;
  pinyin: string;
  toneColors: ToneColor[];
  literal: string;
  poetic: string;
  chinese: string;
}

interface FormattedPoem {
  title: {
    chinese: string;
    pinyin: string;
    english: string;
  };
  lines: FormattedLine[];
  analysis: {
    lineByLine: string[];
    historical: string;
    literary: string[];
    vocabulary: { word: string; pinyin: string; meaning: string }[];
  };
  cultural: string[];
}

export const useFormatPoem = (content: string): FormattedPoem | null => {
  return useMemo(() => {
    // Return null for empty content or non-poem content
    if (!content || !content.includes('《') || !content.includes('》')) {
      return null;
    }
    
    try {
      // Extract title 
      const titleMatch = content.match(/\*\*(.*?)《(.*?)》\*\*/);
      if (!titleMatch) return null;
      
      const poet = titleMatch[1].trim();
      const poemTitle = titleMatch[2].trim();
      
      // Extract pinyin title
      const pinyinTitleMatch = content.match(/\(([^)]+)\)/);
      const pinyinTitle = pinyinTitleMatch ? pinyinTitleMatch[1].trim() : '';
      
      // Extract English title
      const englishTitleMatch = content.match(/\(([^)]+)\)[\s\n]*\*\*诗句/);
      const englishTitle = englishTitleMatch ? 
        content.substring(
          content.indexOf(pinyinTitleMatch![0]) + pinyinTitleMatch![0].length, 
          content.indexOf('**诗句')
        ).trim() : '';
      
      // Extract lines
      const linesSection = content.substring(
        content.indexOf('**诗句 / Lines**'),
        content.indexOf('---')
      );
      
      const lineMatches = linesSection.matchAll(/\d+\. \*\*(.*?)\*\*[\s\S]*?Poetic EN: (.*?)[\s\S]*?诗意中文解释: (.*?)(?=\n\n|\n---)/g);
      
      const lines: FormattedLine[] = [];
      for (const match of lineMatches) {
        const original = match[1].trim();
        
        // Extract pinyin
        const pinyinMatch = match[0].match(/\*\*(.*?)\*\* \(Tone Colors:/);
        const pinyin = pinyinMatch ? pinyinMatch[1].trim() : '';
        
        // Extract tone colors
        const toneColorsMatch = match[0].match(/Tone Colors:(.*?)\)/);
        const toneColorsString = toneColorsMatch ? toneColorsMatch[1].trim() : '';
        const toneColors: ToneColor[] = [];
        
        const toneColorMatches = toneColorsString.matchAll(/(\d️⃣)(.*?)#([A-Fa-f0-9]{6})/g);
        for (const colorMatch of toneColorMatches) {
          toneColors.push({
            emoji: colorMatch[2].trim(),
            color: `#${colorMatch[3]}`
          });
        }
        
        // Extract literal translation
        const literalMatch = match[0].match(/Literal: (.*?)(?=\n)/);
        const literal = literalMatch ? literalMatch[1].trim() : '';
        
        // Get poetic translation
        const poetic = match[2].trim();
        
        // Get Chinese explanation
        const chinese = match[3].trim();
        
        lines.push({
          original,
          pinyin,
          toneColors,
          literal,
          poetic,
          chinese
        });
      }
      
      // Extract analysis sections
      const analysisSection = content.substring(
        content.indexOf('### 诗歌解析'),
        content.indexOf('**[English Section]**')
      );
      
      // Line by line analysis
      const lineByLineAnalysis: string[] = [];
      const lineAnalysisMatches = analysisSection.matchAll(/- \*\*(第.*?句)\*\* .*?：(.*?)(?=\n|$)/g);
      for (const match of lineAnalysisMatches) {
        lineByLineAnalysis.push(`${match[1]}: ${match[2].trim()}`);
      }
      
      // Historical background
      const historicalMatch = analysisSection.match(/- \*\*作者境遇\*\*：(.*?)(?=\n\n|\n3\.)/s);
      const historical = historicalMatch ? historicalMatch[1].trim() : '';
      
      // Literary techniques
      const literaryTechniques: string[] = [];
      const literaryMatches = analysisSection.matchAll(/- \*\*(.*?)\*\*：(.*?)(?=\n|$)/g);
      for (const match of literaryMatches) {
        if (match[1].includes('隐喻') || match[1].includes('意象') || match[1].includes('留白')) {
          literaryTechniques.push(`${match[1]}: ${match[2].trim()}`);
        }
      }
      
      // Vocabulary analysis
      const vocabulary: { word: string; pinyin: string; meaning: string }[] = [];
      const vocabMatches = analysisSection.matchAll(/- \*\*(.*?) \((.*?)\)\*\*：(.*?)(?=\n|$)/g);
      for (const match of vocabMatches) {
        vocabulary.push({
          word: match[1].trim(),
          pinyin: match[2].trim(),
          meaning: match[3].trim()
        });
      }
      
      // Cultural relevance
      const culturalSection = content.substring(
        content.indexOf('### Cultural & Modern Relevance'),
        content.indexOf('Highlightable Class')
      );
      
      const culturalPoints: string[] = [];
      const culturalMatches = culturalSection.matchAll(/\d+\. \*\*(.*?)\*\*: (.*?)(?=\n\n|\n\d\.)/g);
      for (const match of culturalMatches) {
        culturalPoints.push(`${match[1]}: ${match[2].trim()}`);
      }
      
      return {
        title: {
          chinese: `${poet}《${poemTitle}》`,
          pinyin: pinyinTitle,
          english: englishTitle
        },
        lines,
        analysis: {
          lineByLine: lineByLineAnalysis,
          historical,
          literary: literaryTechniques,
          vocabulary
        },
        cultural: culturalPoints
      };
    } catch (error) {
      console.error("Error parsing poem:", error);
      return null;
    }
  }, [content]);
};