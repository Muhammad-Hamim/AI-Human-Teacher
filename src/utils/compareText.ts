import { pinyin } from "pinyin-pro"

export const compareText = (text1: string, text2: string) => {
    console.log('reference text (target):', text1);
    console.log('comparison text (user speech):', text2);
    
    // Check for empty inputs
    if (!text1 || !text2) {
        console.error('Empty input received in compareText:', {text1, text2});
        throw new Error('Reference or comparison text is empty');
    }

    // Convert both text into pinyin array
    const referencePinyinArray = pinyin(text1, {toneType:"num", type:"array"});
    const comparisonPinyinArray = pinyin(text2, {toneType:"num", type:"array"});
    
    console.log('referencePinyinArray:', referencePinyinArray);
    console.log('comparisonPinyinArray:', comparisonPinyinArray);
    
    // Use only length of the referencePinyinArray text to compare
    const referencePinyinArrayLength = referencePinyinArray.length;
    
    // Initialize variable for matching and unmatched characters
    const matchingCharacters: string[] = [];
    const unmatchedCharacters: string[] = [];
    
    // Use reduce to count the matches and track unmatched characters
    const matchCount = referencePinyinArray.reduce((count, pinyin1, index) => {
        // Ensure the comparison index is within bounds for the second text
        if (index < comparisonPinyinArray.length) {
            if (pinyin1 === comparisonPinyinArray[index]) {
                matchingCharacters.push(text2[index]);
                return count + 1; // Increment count if the pinyin matches
            } else {
                unmatchedCharacters.push(text2[index] || ''); // Store the unmatched character
                return count; // No match, return the current count
            }
        }
        return count; // Return the count if the index is out of bounds
    }, 0);

    // If no matches were found but we have comparison text, track those as unmatched
    if (matchCount === 0 && comparisonPinyinArray.length > 0) {
        for (let i = 0; i < Math.min(comparisonPinyinArray.length, 10); i++) {
            unmatchedCharacters.push(text2[i] || '');
        }
    }

    // Calculate the percentage of matching characters
    const matchPercentage = referencePinyinArrayLength > 0 
        ? (matchCount / referencePinyinArrayLength) * 100 
        : 0;

    console.log('Match count:', matchCount);
    console.log('Match percentage:', matchPercentage);
    console.log('Unmatched characters:', unmatchedCharacters);

    // Return the results
    return {
        matchCount,
        unmatchedCharacters,
        matchPercentage,
        matchingCharacters
    }
}