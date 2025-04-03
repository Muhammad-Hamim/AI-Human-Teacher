@echo off
echo ========= Testing Poem Retrieval =========

:: Compile TypeScript files first
echo Compiling TypeScript files...
npx tsc

IF %ERRORLEVEL% NEQ 0 (
  echo TypeScript compilation failed.
  exit /b 1
)

:: Check for MongoDB connection
echo Checking database connection...
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poetry_db').then(() => { console.log('MongoDB connected successfully'); process.exit(0); }).catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });"

IF %ERRORLEVEL% NEQ 0 (
  echo Database connection failed. Please check your MongoDB connection.
  exit /b 1
)

:: Run the poem test
echo Testing poem retrieval...
node -e "
const mongoose = require('mongoose');
const { Poem } = require('./dist/app/Models/poem/poem.model');

// Connect to database
async function testPoemRetrieval() {
  try {
    // Make sure we're connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poetry_db');
    }
    
    // Find a random poem
    const count = await Poem.countDocuments();
    
    if (count === 0) {
      console.log('No poems found in the database. Please add some poems first.');
      process.exit(1);
    }
    
    // Get a random poem
    const random = Math.floor(Math.random() * count);
    const poem = await Poem.findOne().skip(random);
    
    console.log('===================================');
    console.log(`Found poem: ${poem.title} by ${poem.author} (${poem.dynasty})`);
    console.log('-----------------------------------');
    console.log('First line in Chinese: ' + poem.lines[0].chinese);
    console.log('Translation: ' + poem.lines[0].translation);
    console.log('===================================');
    console.log('This poem is available to the AI through the database interface.');
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error testing poem retrieval:', error);
    process.exit(1);
  }
}

testPoemRetrieval();
"

IF %ERRORLEVEL% NEQ 0 (
  echo Poem retrieval test failed.
  exit /b 1
)

echo Poem retrieval test completed successfully. 