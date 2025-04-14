# AI Human Teacher for Chinese Poetry Learning: User Guide

## Welcome to AI Human Teacher

Step into a world where ancient Chinese poetry comes alive through cutting-edge technology. The AI Human Teacher for Chinese Poetry Learning transforms the complexities of classical Chinese poetry into an engaging, interactive experience. Powered by DeepSeek, this web application offers real-time pronunciation correction, AI-generated storytelling, cultural and historical insights, and visually stunning AI-generated art to deepen your connection to each poem’s emotional and cultural essence.

Whether you’re a beginner, a student, or a seasoned enthusiast, this platform makes Chinese poetry accessible and meaningful. Explore, learn, and connect with one of humanity’s richest poetic traditions in a whole new way.

**[Space for Photo]**

## Purpose of This Guide

This guide is designed to help you navigate the features of the AI Human Teacher application, from getting started to mastering its interactive tools. Each section provides step-by-step instructions, feature overviews, and practical tips to enhance your learning experience.

**[Space for Photo]**

## Getting Started

### Accessing the Application

- **Platforms**: Access AI Human Teacher via web browser at [insert URL], or download the mobile app (iOS/Android, coming soon).
- **System Requirements**: A modern web browser (Chrome, Firefox, Safari) with an active internet connection. For voice features, ensure your device has a microphone.

### Homepage Overview

Upon launching the application, you’ll land on the homepage, which includes:

- **Textbox**: Interact with the AI via text or voice input.
- **Language Toggler**: Switch between English and Chinese for bilingual support.
- **Navigation Menu**: Access core features like Poems, Interactive Learning, and AI Analysis.

**[Space for Photo]**

## Core Features

### 1. Ask AI Chat

Engage in natural, conversational learning with an AI specialized in Chinese poetry.

#### What It Is

A dialogue system that answers questions, explains poems, and provides insights in real-time, supporting both text and voice interactions.

#### Key Features

- **Real-Time Chat**: Interactive messaging with conversation history.
- **Voice Interaction**: Speak and hear responses for a dynamic experience.
- **Multilingual Support**: Communicate in English or Chinese.
- **Poem-Specific Knowledge**: In-depth analysis and explanations of Chinese poetry.
- **Audio Responses**: Text-to-speech for spoken replies.

#### How to Use

1. Type a question in the homepage textbox (e.g., “Explain Li Bai’s ‘Quiet Night Thoughts’”) and press Enter.
2. For voice input, click the microphone icon, select your language, and speak naturally.
3. View or listen to the AI’s response, which may include text, audio, or both.
4. Continue the conversation—context is preserved for coherent exchanges.

#### Technical Flow

- **Frontend**: Built with React/TypeScript, featuring modular components, Redux state management, and WebSocket for real-time streaming.
- **Backend**: Node.js/Express connects to DeepSeek’s language model, processes messages, and generates audio via text-to-speech (TTS) services.
- **Data Flow**:
  - User inputs text or voice.
  - Frontend sends the request to the backend API.
  - Backend retrieves conversation history and poem data, processes via AI, and returns a response.
  - Frontend displays text and plays audio (if applicable).

#### Benefits

- Personalized, interactive learning companion.
- Bridges language barriers with bilingual support.
- Deepens understanding through natural dialogue.

#### Usage Tip

Use text chat in noisy environments or for detailed reading; switch to voice for a conversational feel.

**[Space for Photo]**

### 2. Poem Reader

Immerse yourself in Chinese poetry with an interactive reading experience.

#### What It Is

A tool that presents poems in multiple formats, with audio pronunciation, pinyin, translations, and contextual notes.

#### Key Features

- **Dual View Modes**: Reading View (elegant display) or Study View (detailed breakdown).
- **Character-by-Character Audio**: Click any character to hear its pronunciation.
- **Line-by-Line Recitation**: Listen to individual lines with proper intonation.
- **Full Poem Audio**: Hear the entire poem read aloud.
- **Pinyin and Translations**: Phonetic guides and English translations side-by-side.
- **Contextual Notes**: Explanations of historical and cultural significance.

#### How to Use

1. Navigate to **Poems** > **Browse Collection** or **Show Poem List**.
2. Select a poem to view its interactive page.
3. Choose **Reading View** for a clean display or **Study View** for detailed analysis.
4. Interact with the poem:
   - Click characters for pronunciation.
   - Play lines or the full poem.
   - Toggle pinyin, translations, or notes for deeper insights.

#### Technical Flow

- Poem data is retrieved from a backend database.
- Audio uses pre-recorded resources or synthesized speech.
- Frontend highlights active lines/characters and syncs audio playback.

#### Benefits

- Makes classical poetry accessible to all learners.
- Supports pronunciation and comprehension.
- Offers flexible engagement (reading, listening, studying).

#### Usage Tip

Start with Reading View for an immersive experience, then switch to Study View for line-by-line learning.

**[Space for Photo]**

### 3. Virtual Storyteller

Experience poems as dynamic, narrated stories.

#### What It Is

An audio feature that transforms poems into expressive narrations, enhancing emotional and auditory engagement.

#### Key Features

- **AI-Generated Narration**: Natural, professional-quality audio.
- **Bilingual Support**: Narrations in Chinese or English.
- **Customizable Playback**: Adjust volume and speed.
- **Visual Transcript**: Follow along with narrated text.

#### How to Use

1. Select a poem and navigate to the **Virtual Storyteller** tab.
2. Choose your preferred language (Chinese/English).
3. Click **Generate Narration** and wait for the AI to process.
4. Play the narration, adjust settings, and view the transcript.

#### Technical Flow

- Frontend sends poem data to the backend.
- Backend generates narration using DeepSeek and returns base64-encoded audio.
- Frontend provides playback controls and displays synced text.

#### Benefits

- Appeals to auditory learners.
- Enhances pronunciation and rhythm understanding.
- Creates an emotional connection to poetry.

#### Usage Tip

Use headphones for an immersive storytelling experience.

**[Space for Photo]**

### 4. Writing Practice

Learn to write Chinese characters through hands-on practice.

#### What It Is

An interactive calligraphy tool for practicing character writing, with animations, quizzes, and audio support.

#### Key Features

- **Interactive Canvas**: Draw characters digitally.
- **Stroke Animation**: Watch correct stroke order.
- **Quiz Mode**: Test stroke sequence knowledge.
- **Audio Pronunciation**: Hear each character’s sound.
- **Customizable Tools**: Adjust brush size and color.
- **Progress Tracking**: Save practice results.

#### How to Use

1. Select a poem and choose a character to practice.
2. Pick a mode:
   - **Practice Mode**: Trace freely with a template.
   - **Animation Mode**: Watch stroke order demonstrations.
   - **Quiz Mode**: Draw strokes in sequence with real-time feedback.
3. In **Quiz Mode**:
   - Follow prompts to draw each stroke.
   - Receive hints for mistakes and see animations for corrections.
   - View progress stats (strokes completed, errors).
4. Save your work or export as an image.

#### Technical Flow

- Frontend renders a canvas with stroke guides.
- Backend validates stroke accuracy and tracks progress.
- Audio and animations are synced with user actions.

#### Benefits

- Builds muscle memory for writing.
- Reinforces stroke order through interactive feedback.
- Makes learning fun with gamified quizzes.

#### Usage Tip

Practice regularly and save your best calligraphy to track improvement.

**[Space for Photo]**

### 5. Vocabulary & Language Exercises

Master poem-specific vocabulary with contextual learning.

#### What It Is

A system that teaches vocabulary through explanations, examples, and quizzes, tailored to each poem’s content.

#### Key Features

- **Vocabulary Browser**: View words with HSK level filtering.
- **Detailed Explanations**: Includes pronunciation, meanings, and example sentences.
- **Quiz System**: Fill-in-the-blank, translation, and matching quizzes.
- **Audio Pronunciation**: Hear authentic word sounds.
- **HSK Indicators**: Aligns with proficiency levels.

#### How to Use

1. Select a poem and navigate to the **Exercises** tab.
2. Browse vocabulary cards with details like pronunciation and usage.
3. Click **Get All Explanations** for AI-generated insights.
4. Take quizzes to test your knowledge:
   - Fill in blanks.
   - Translate words.
   - Match vocabulary to meanings.

#### Technical Flow

- Server retrieves or generates vocabulary data using DeepSeek.
- Explanations are cached in the database for faster future access.
- Frontend renders interactive cards and quiz interfaces.

#### Benefits

- Contextualizes vocabulary within poems.
- Supports multi-modal learning (reading, listening, testing).
- Adapts to your proficiency level.

#### Usage Tip

Filter by HSK level to focus on vocabulary suited to your skills.

**[Space for Photo]**

### 6. Pronunciation Practice

Improve your Chinese pronunciation with real-time feedback.

#### What It Is

A voice recognition tool that compares your spoken recitation to correct pronunciation, offering detailed feedback.

#### Key Features

- **Speech Recognition**: Analyzes Chinese speech in real-time.
- **Practice Modes**: Line-by-line or full poem recitation.
- **Pronunciation Feedback**: Accuracy scores and error highlights.
- **Audio Examples**: Native pronunciation samples.
- **Visual Feedback**: Color-coded accuracy indicators.

#### How to Use

1. Select a poem and go to the **Voice** tab.
2. Choose **Line-by-Line** or **Full Poem** mode.
3. Listen to the sample pronunciation (optional).
4. Click the microphone and recite the text.
5. Review feedback:
   - Overall accuracy percentage.
   - Specific mispronounced characters.
   - Suggestions for improvement.

#### Technical Flow

- Uses the browser’s Web Speech API for Mandarin Chinese.
- Backend compares user speech to target text.
- Frontend displays visual feedback and syncs audio examples.

#### Benefits

- Builds confidence in speaking Chinese.
- Identifies pronunciation challenges.
- Reinforces poem memorization through vocal practice.

#### Usage Tip

Practice in a quiet environment for accurate speech recognition.

**[Space for Photo]**

### 7. Imagery & Symbolism

Explore the deeper meanings behind poetic imagery.

#### What It Is

A tool that analyzes symbols in poems, explains their cultural significance, and generates AI artwork to visualize themes.

#### Key Features

- **Symbol Analysis**: Identifies 3–5 key symbols per poem.
- **Cultural Context**: Explains historical and cultural meanings.
- **Interactive Visualization**: Highlights symbols in the text.
- **AI-Generated Art**: Creates illustrations based on imagery.
- **Bilingual Support**: Available in Chinese and English.

#### How to Use

1. Select a poem and navigate to the **Imagery** tab.
2. Click **Generate Analysis** to view identified symbols and explanations.
3. Interact with highlighted symbols in the poem text.
4. Click **Generate Images** to create AI artwork inspired by the poem.

#### Technical Flow

- Backend uses DeepSeek to analyze symbols and generate cultural insights.
- AI creates Stable Diffusion prompts for artwork.
- Frontend displays interactive text highlights and images.

#### Benefits

- Makes abstract imagery tangible.
- Deepens cultural understanding.
- Creates shareable, poem-inspired art.

#### Usage Tip

Explore symbol explanations before generating images to appreciate the artwork’s context.

**[Space for Photo]**

### 8. AI Poetry Analysis

Gain deeper insights into poems with AI-driven literary analysis.

#### What It Is

A tool that breaks down a poem’s emotional, structural, and cultural elements, with interactive Q&A for further exploration.

#### Key Features

- **Emotional Analysis**: Visualizes the poem’s emotional arc.
- **Literary Techniques**: Identifies rhythm, structure, and poetic devices.
- **Modern Relevance**: Connects ancient themes to today’s world.
- **AI Q&A**: Ask specific questions about the poem.

#### How to Use

1. Select a poem and go to the **AI Analysis** tab.
2. View visualizations of emotional and structural elements.
3. Read explanations of literary techniques and modern connections.
4. Use the Q&A chat to ask follow-up questions (e.g., “What inspired this poem?”).

#### Technical Flow

- Backend processes poem data through DeepSeek.
- Results are returned in JSON and rendered as interactive charts/text.
- Q&A integrates with the Ask AI Chat system.

#### Benefits

- Simplifies complex literary concepts.
- Offers multiple perspectives on each poem.
- Encourages curiosity through interactive Q&A.

#### Usage Tip

Use the emotional analysis to connect with the poem’s mood before diving into technical details.

**[Space for Photo]**

## Tips for Success

- **Start Simple**: Begin with well-known poems like those by Li Bai or Du Fu to build confidence.
- **Mix Modalities**: Combine reading, listening, and writing for a well-rounded experience.
- **Practice Regularly**: Short, consistent sessions improve pronunciation and vocabulary retention.
- **Explore Imagery**: Use the Imagery & Symbolism feature to uncover hidden meanings.
- **Ask Questions**: Leverage the Ask AI Chat to clarify doubts or dive deeper.

**[Space for Photo]**

## Technical Support

- **FAQs**: Check [insert FAQ link] for common issues.
- **Contact Us**: Reach out at [insert support email] for assistance.
- **Browser Compatibility**: Ensure your browser is updated for optimal performance.

**[Space for Photo]**

## Conclusion

The AI Human Teacher for Chinese Poetry Learning is more than a tool—it’s a bridge between ancient artistry and modern technology. By blending AI-powered insights, interactive learning, and creative visualization, it invites you to experience Chinese poetry as a living, breathing tradition. Start your journey today and let the words of the Tang and Song dynasties inspire you.

Happy learning!

**[Space for Photo]**