@echo off
echo ========= Poetry AI Training Utility =========

:: Set environment variables for the training (with debug output)
echo Setting environment variables...
SET AI_API_KEY=%AI_API_KEY%
SET QWEN2_API_KEY=%QWEN2_API_KEY%
SET POETRY_TRAINING=true
echo POETRY_TRAINING=%POETRY_TRAINING%

:: Check for MongoDB connection and list collections
echo Checking database connection...
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poetry_db').then(async () => { console.log('MongoDB connected successfully'); const db = mongoose.connection.db; const collections = await db.listCollections().toArray(); console.log('Collections in database:'); collections.forEach(c => console.log(`- ${c.name}`)); console.log('Checking poem collections:'); const poemCount = await db.collection('poems').countDocuments().catch(() => 0); const PoemCount = await db.collection('Poems').countDocuments().catch(() => 0); const poemModelCount = await db.collection('poem').countDocuments().catch(() => 0); const PoemModelCount = await db.collection('Poem').countDocuments().catch(() => 0); console.log(`'poems' collection: ${poemCount} documents`); console.log(`'Poems' collection: ${PoemCount} documents`); console.log(`'poem' collection: ${poemModelCount} documents`); console.log(`'Poem' collection: ${PoemModelCount} documents`); process.exit(0); }).catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });"

IF %ERRORLEVEL% NEQ 0 (
  echo Database connection failed. Please check your MongoDB connection.
  exit /b 1
)

:: Compile TypeScript files first
echo Compiling TypeScript files...
npx tsc

IF %ERRORLEVEL% NEQ 0 (
  echo TypeScript compilation failed.
  exit /b 1
)

:: Start the training process
echo Starting poetry database indexing for AI...
node -e "const { indexPoemDatabase } = require('./dist/app/utils/poemTraining.js'); indexPoemDatabase().then(() => { console.log('Database indexing complete'); process.exit(0); }).catch(err => { console.error('Indexing error:', err); process.exit(1); });"

IF %ERRORLEVEL% NEQ 0 (
  echo Database indexing failed.
  exit /b 1
)

:: Start the server with poetry AI enabled
echo Starting server with Poetry AI enabled...
npm run start:dev

echo Poetry AI training and setup complete! 