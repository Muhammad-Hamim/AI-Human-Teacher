import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Volume2, RefreshCw, Pause } from "lucide-react";

interface PoemLine {
  chinese: string;
  pinyin: string;
  translation: string;
  explanation?: string;
}

interface VocabularyWord {
  word: string;
  pinyin: string;
  meaning: string;
  level: string;
  example?: string;
}

interface AudioResource {
  url: string;
  contentType: string;
  duration: number;
}

interface LineReading extends AudioResource {
  lineId: number;
  text: string;
  pinyin: string;
}

interface WordPronunciation extends AudioResource {
  word: string;
  pinyin: string;
}

interface AudioResources {
  fullReading?: AudioResource;
  lineReadings?: LineReading[];
  wordPronunciations?: WordPronunciation[];
}

interface Poem {
  _id: string;
  title: string;
  author: string;
  dynasty?: string;
  lines: PoemLine[];
  vocabulary?: VocabularyWord[];
  audioResources?: AudioResources;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  lineIndex?: number;
  pinyin?: string;
}

interface LanguageExercisesProps {
  poem: Poem;
}

export default function LanguageExercises({ poem }: LanguageExercisesProps) {
  const [vocabularyTab, setVocabularyTab] = useState("all");
  const [quizType, setQuizType] = useState("fillBlank");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Set up event listeners
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener("error", () => {
        setIsPlaying(false);
        console.error("Audio playback error");
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Generate quiz questions when quiz type changes
  useEffect(() => {
    generateQuiz(quizType);
  }, [quizType]);

  // Generate quiz based on type
  const generateQuiz = (type: string) => {
    setShowResults(false);
    setUserAnswers([]);

    switch (type) {
      case "fillBlank":
        generateFillBlankQuiz();
        break;
      case "translation":
        generateTranslationQuiz();
        break;
      case "matching":
        generateMatchingQuiz();
        break;
      default:
        generateFillBlankQuiz();
    }
  };

  // Generate fill-in-the-blank quiz
  const generateFillBlankQuiz = () => {
    const questions = poem.lines.map((line: PoemLine, index: number) => {
      const words = line.chinese.split("");
      const blankIndex = Math.floor(Math.random() * words.length);
      const answer = words[blankIndex];

      // Create a copy of the words array and replace the blank with an underscore
      const questionWords = [...words];
      questionWords[blankIndex] = "_";

      return {
        id: `fill-${index}`,
        question: questionWords.join(""),
        options: getRandomOptions(answer, poem),
        answer: answer,
        lineIndex: index,
      };
    });

    setQuizQuestions(questions);
  };

  // Generate translation quiz
  const generateTranslationQuiz = () => {
    const questions = poem.lines.map((line: PoemLine, index: number) => {
      return {
        id: `trans-${index}`,
        question: line.chinese,
        options: [
          line.translation,
          getRandomTranslation(index, poem),
          getRandomTranslation(index, poem),
          getRandomTranslation(index, poem),
        ].sort(() => Math.random() - 0.5),
        answer: line.translation,
        lineIndex: index,
      };
    });

    setQuizQuestions(questions);
  };

  // Generate matching quiz
  const generateMatchingQuiz = () => {
    // Extract vocabulary words
    const vocabulary = poem.vocabulary || [];

    // Shuffle and take up to 8 words
    const selectedVocab = [...vocabulary]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    const questions = selectedVocab.map(
      (word: VocabularyWord, index: number) => {
        return {
          id: `match-${index}`,
          question: word.word,
          options: [
            word.meaning,
            getRandomMeaning(word.meaning, vocabulary),
            getRandomMeaning(word.meaning, vocabulary),
            getRandomMeaning(word.meaning, vocabulary),
          ].sort(() => Math.random() - 0.5),
          answer: word.meaning,
          pinyin: word.pinyin,
        };
      }
    );

    setQuizQuestions(questions);
  };

  // Get random options for fill-in-the-blank quiz
  const getRandomOptions = (answer: string, poem: Poem) => {
    const allChars = poem.lines.map((line: PoemLine) => line.chinese).join("");
    const uniqueChars = [...new Set(allChars.split(""))];

    // Filter out the answer
    const otherChars = uniqueChars.filter((char) => char !== answer);

    // Shuffle and take 3 random characters
    const randomChars = otherChars.sort(() => Math.random() - 0.5).slice(0, 3);

    // Add the answer and shuffle
    return [answer, ...randomChars].sort(() => Math.random() - 0.5);
  };

  // Get random translation for translation quiz
  const getRandomTranslation = (currentIndex: number, poem: Poem) => {
    const otherLines = poem.lines.filter(
      (_: PoemLine, i: number) => i !== currentIndex
    );
    const randomLine =
      otherLines[Math.floor(Math.random() * otherLines.length)];
    return randomLine.translation;
  };

  // Get random meaning for matching quiz
  const getRandomMeaning = (
    currentMeaning: string,
    vocabulary: VocabularyWord[]
  ) => {
    const otherWords = vocabulary.filter(
      (word) => word.meaning !== currentMeaning
    );
    const randomWord =
      otherWords[Math.floor(Math.random() * otherWords.length)];
    return randomWord ? randomWord.meaning : "unknown";
  };

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctCount = 0;

    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);
  };

  // Reset quiz
  const resetQuiz = () => {
    generateQuiz(quizType);
  };

  // Speak text using audio resources when available
  const speak = (text: string) => {
    // If already playing, stop current audio
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    const hasAudioResources =
      poem.audioResources &&
      (poem.audioResources.wordPronunciations ||
        poem.audioResources.lineReadings);

    if (hasAudioResources) {
      // First try to find if this is a line from the poem
      const lineIndex = poem.lines.findIndex(
        (line: PoemLine) => line.chinese === text
      );

      if (lineIndex !== -1 && poem.audioResources?.lineReadings) {
        // This is a full line, use line reading
        const lineAudio = poem.audioResources.lineReadings.find(
          (l: LineReading) => l.lineId === lineIndex + 1
        );

        if (lineAudio && lineAudio.url && audioRef.current) {
          audioRef.current.src = lineAudio.url;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.error("Error playing line audio:", err);
              fallbackToSpeechSynthesis(text);
            });
          return;
        }
      }

      // If it's not a line or line audio not found, check if it's a single character
      if (text.length === 1 && poem.audioResources?.wordPronunciations) {
        const wordAudio = poem.audioResources.wordPronunciations.find(
          (w: WordPronunciation) => w.word === text
        );

        if (wordAudio && wordAudio.url && audioRef.current) {
          audioRef.current.src = wordAudio.url;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.error("Error playing word audio:", err);
              fallbackToSpeechSynthesis(text);
            });
          return;
        }
      }

      // For vocabulary words that might be longer than a single character
      if (poem.vocabulary) {
        const vocab = poem.vocabulary.find(
          (w: VocabularyWord) => w.word === text
        );
        if (vocab && poem.audioResources?.wordPronunciations) {
          // Try to find audio for the vocabulary word
          const wordAudio = poem.audioResources.wordPronunciations.find(
            (w: WordPronunciation) => w.word === text
          );

          if (wordAudio && wordAudio.url && audioRef.current) {
            audioRef.current.src = wordAudio.url;
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.error("Error playing vocabulary audio:", err);
                fallbackToSpeechSynthesis(text);
              });
            return;
          }
        }
      }
    }

    // Fallback to speech synthesis if no audio found
    fallbackToSpeechSynthesis(text);
  };

  // Fallback to browser speech synthesis
  const fallbackToSpeechSynthesis = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
    );

    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Filter vocabulary by level
  const filterVocabulary = (level: string) => {
    if (!poem.vocabulary) return [];

    if (level === "all") {
      return poem.vocabulary;
    }

    return poem.vocabulary.filter(
      (word: VocabularyWord) => word.level === level
    );
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="vocabulary">
        <TabsList className="mb-6">
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Vocabulary</h2>

            <Tabs value={vocabularyTab} onValueChange={setVocabularyTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="HSK1">HSK1</TabsTrigger>
                <TabsTrigger value="HSK2">HSK2</TabsTrigger>
                <TabsTrigger value="HSK3">HSK3</TabsTrigger>
                <TabsTrigger value="HSK4">HSK4+</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterVocabulary(vocabularyTab).map(
                  (word: VocabularyWord, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">{word.word}</CardTitle>
                        <Badge variant="outline">{word.level}</Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-gray-500 mb-1">{word.pinyin}</p>
                        <p className="font-medium">{word.meaning}</p>
                        <Button
                          variant={
                            isPlaying &&
                            audioRef.current?.src.includes(word.word)
                              ? "secondary"
                              : "ghost"
                          }
                          size="sm"
                          className="mt-2 h-8 px-2"
                          onClick={() => speak(word.word)}
                        >
                          <Volume2 size={16} className="mr-1" />
                          {isPlaying &&
                          audioRef.current?.src.includes(word.word)
                            ? "Playing..."
                            : "Pronounce"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="quiz">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Quiz</h2>

              <div className="flex gap-2">
                <Button
                  variant={quizType === "fillBlank" ? "default" : "outline"}
                  onClick={() => setQuizType("fillBlank")}
                >
                  Fill in the Blank
                </Button>
                <Button
                  variant={quizType === "translation" ? "default" : "outline"}
                  onClick={() => setQuizType("translation")}
                >
                  Translation
                </Button>
                <Button
                  variant={quizType === "matching" ? "default" : "outline"}
                  onClick={() => setQuizType("matching")}
                >
                  Matching
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              {quizQuestions.map((question, questionIndex) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Question {questionIndex + 1}
                      </CardTitle>
                      {showResults &&
                        (userAnswers[questionIndex] === question.answer ? (
                          <CheckCircle className="text-green-500" />
                        ) : (
                          <XCircle className="text-red-500" />
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xl font-medium">
                          {question.question}
                        </p>
                        {question.pinyin && (
                          <p className="text-sm text-gray-500">
                            ({question.pinyin})
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => speak(question.question)}
                        >
                          {isPlaying &&
                          audioRef.current?.src.includes(
                            encodeURIComponent(question.question)
                          ) ? (
                            <Pause size={16} />
                          ) : (
                            <Volume2 size={16} />
                          )}
                        </Button>
                      </div>

                      {showResults &&
                        userAnswers[questionIndex] !== question.answer && (
                          <p className="text-sm text-red-500 mt-1">
                            Correct answer: {question.answer}
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {question.options.map(
                        (option: string, optionIndex: number) => (
                          <Button
                            key={optionIndex}
                            variant={
                              userAnswers[questionIndex] === option
                                ? showResults
                                  ? option === question.answer
                                    ? "default"
                                    : "destructive"
                                  : "default"
                                : "outline"
                            }
                            className="justify-start h-auto py-2 px-4"
                            onClick={() =>
                              !showResults &&
                              handleAnswerSelect(questionIndex, option)
                            }
                            disabled={showResults}
                          >
                            {option}
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between items-center">
                {showResults ? (
                  <>
                    <p className="text-lg font-medium">
                      Score: {score}/{quizQuestions.length} (
                      {Math.round((score / quizQuestions.length) * 100)}%)
                    </p>
                    <Button onClick={resetQuiz}>
                      <RefreshCw size={16} className="mr-2" />
                      Try Again
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={checkAnswers}
                    disabled={userAnswers.length < quizQuestions.length}
                    className="ml-auto"
                  >
                    Check Answers
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
