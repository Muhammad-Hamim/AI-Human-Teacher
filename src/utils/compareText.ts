import { pinyin } from "pinyin-pro";

export const compareText = (text1: string, text2: string) => {
  console.log("reference text (target):", text1);
  console.log("comparison text (user speech):", text2);

  // Check for empty inputs
  if (!text1 || !text2) {
    console.error("Empty input received in compareText:", { text1, text2 });
    throw new Error("Reference or comparison text is empty");
  }

  // Convert both text into pinyin array
  const referencePinyinArray = pinyin(text1, {
    toneType: "num",
    type: "array",
  });
  const comparisonPinyinArray = pinyin(text2, {
    toneType: "num",
    type: "array",
  });

  console.log("referencePinyinArray:", referencePinyinArray);
  console.log("comparisonPinyinArray:", comparisonPinyinArray);

  // Use only length of the referencePinyinArray text to compare
  const referencePinyinArrayLength = referencePinyinArray.length;

  // Initialize variable for matching and unmatched characters
  const matchingCharacters: string[] = [];
  const unmatchedCharacters: string[] = [];

  // Track which characters were matched and which were not
  for (let i = 0; i < referencePinyinArray.length; i++) {
    const referencePinyin = referencePinyinArray[i];
    const referenceChar = text1[i];

    // Check if this character's pinyin exists in the comparison text
    let matched = false;

    // First try to find a direct match at the same position
    if (
      i < comparisonPinyinArray.length &&
      referencePinyin === comparisonPinyinArray[i]
    ) {
      matched = true;
      matchingCharacters.push(referenceChar);
    } else {
      // If not matched at the same position, check if it appears elsewhere
      // This helps with slight word order differences
      let foundMatch = false;
      for (
        let j = Math.max(0, i - 2);
        j < Math.min(comparisonPinyinArray.length, i + 3);
        j++
      ) {
        if (referencePinyin === comparisonPinyinArray[j]) {
          foundMatch = true;
          matchingCharacters.push(referenceChar);
          break;
        }
      }

      if (!foundMatch) {
        // This reference character was not found in the comparison text
        unmatchedCharacters.push(referenceChar);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        matched = true;
      }
    }
  }

  // Calculate match count based on matching characters
  const matchCount = matchingCharacters.length;

  // Calculate the percentage of matching characters
  const matchPercentage =
    referencePinyinArrayLength > 0
      ? (matchCount / referencePinyinArrayLength) * 100
      : 0;

  console.log("Match count:", matchCount);
  console.log("Match percentage:", matchPercentage);
  console.log("Unmatched characters:", unmatchedCharacters);

  // Return the results
  return {
    matchCount,
    unmatchedCharacters,
    matchPercentage,
    matchingCharacters,
  };
};
