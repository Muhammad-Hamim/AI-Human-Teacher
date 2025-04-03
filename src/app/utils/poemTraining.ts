import mongoose from "mongoose";
import { TPoem } from "../Models/poem/poem.interface";
import { Poem } from "../Models/poem/poem.model";
import fs from "fs";
import path from "path";

/**
 * Connect to MongoDB if not already connected
 */
async function ensureMongoDBConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    console.log("Connecting to MongoDB...");
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/poetry_db";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");
  }
}

/**
 * Indexes the poem database for AI training
 * This function prepares the poem data for easy retrieval by the AI
 */
export async function indexPoemDatabase(): Promise<void> {
  console.log("Starting poem database indexing...");

  try {
    // Ensure we're connected to MongoDB
    await ensureMongoDBConnection();

    // Find the collection with the most poems
    console.log("Searching for poem collections...");

    // Collection names to try
    const collectionNames = [
      "poems",
      "Poems",
      "poem",
      "Poem",
      "ChinesePoems",
      "chinesepoems",
    ];
    let maxCount = 0;
    let bestCollection = null;

    // Check if connection has a database
    if (!mongoose.connection.db) {
      console.error("MongoDB connection has no database");
      return;
    }

    // Search all collections in the database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("Collections in database:");
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
    }

    // Check each potential poem collection
    for (const collName of collectionNames) {
      try {
        // Check if this collection exists
        if (collections.some((c) => c.name === collName)) {
          // Count documents in this collection
          const count = await mongoose.connection.db
            .collection(collName)
            .countDocuments();
          console.log(`Collection '${collName}' has ${count} documents`);

          if (count > maxCount) {
            maxCount = count;
            bestCollection = collName;
          }
        }
      } catch (e) {
        console.log(`Error checking collection ${collName}:`, e);
      }
    }

    // For collections not in our list, check if they might be poem collections
    for (const collection of collections) {
      if (!collectionNames.includes(collection.name)) {
        try {
          // Get a sample document to see if it looks like a poem
          const sample = await mongoose.connection.db
            .collection(collection.name)
            .findOne(
              {},
              { projection: { title: 1, author: 1, dynasty: 1, lines: 1 } }
            );

          if (
            sample &&
            (sample.title || sample.author || sample.dynasty || sample.lines)
          ) {
            // This looks like a poem collection
            const count = await mongoose.connection.db
              .collection(collection.name)
              .countDocuments();
            console.log(
              `Found potential poem collection: ${collection.name} with ${count} documents`
            );
            console.log(
              "Sample:",
              JSON.stringify(sample).substring(0, 200) + "..."
            );

            if (count > maxCount) {
              maxCount = count;
              bestCollection = collection.name;
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Use the best collection, or default to "Poem"
    let Poem: mongoose.Model<any>;
    if (bestCollection) {
      console.log(
        `Using collection '${bestCollection}' with ${maxCount} poems`
      );

      // Try to register the schema for this collection
      const lineSchema = new mongoose.Schema(
        {
          chinese: String,
          pinyin: String,
          translation: String,
          explanation: String,
        },
        { _id: false }
      );

      const poemSchema = new mongoose.Schema(
        {
          title: String,
          author: String,
          dynasty: String,
          lines: [lineSchema],
          explanation: String,
          historicalCulturalContext: String,
        },
        { timestamps: true }
      );

      // Use existing model or create new one
      try {
        Poem = mongoose.model(bestCollection);
      } catch (e) {
        Poem = mongoose.model(bestCollection, poemSchema, bestCollection);
      }
    } else {
      console.log('No poem collections found, using default "Poem" model');
      Poem = mongoose.model<TPoem & mongoose.Document>("Poem");
    }

    // Count poems in the database using the selected model
    const poemCount = await Poem.countDocuments();
    console.log(
      `Found ${poemCount} poems in the database using model ${Poem.modelName}`
    );

    if (poemCount === 0) {
      console.warn(
        "No poems found in the database. AI responses may be limited."
      );
      return;
    }

    // Create a JSON index of all poems for quick reference
    const poems = await Poem.find().lean();

    // Create summary information for AI training
    const poemSummaries = poems.map((poem: any) => ({
      id: poem._id,
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      firstLine: (poem.lines && poem.lines[0]?.chinese) || "",
      lineCount: poem.lines ? poem.lines.length : 0,
    }));

    // Create an index by dynasty
    const dynastyIndex: Record<string, string[]> = {};
    poems.forEach((poem: any) => {
      if (!dynastyIndex[poem.dynasty]) {
        dynastyIndex[poem.dynasty] = [];
      }
      dynastyIndex[poem.dynasty].push(poem._id?.toString() || "");
    });

    // Create an index by author
    const authorIndex: Record<string, string[]> = {};
    poems.forEach((poem: any) => {
      if (!authorIndex[poem.author]) {
        authorIndex[poem.author] = [];
      }
      authorIndex[poem.author].push(poem._id?.toString() || "");
    });

    // Save the indexes to disk for fast lookup
    const indexData = {
      totalPoems: poemCount,
      summaries: poemSummaries,
      dynastyIndex,
      authorIndex,
      lastUpdated: new Date().toISOString(),
    };

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the index to file
    fs.writeFileSync(
      path.join(dataDir, "poem-index.json"),
      JSON.stringify(indexData, null, 2)
    );

    console.log("Poem database indexing completed successfully");
    console.log(`Index saved to ${path.join(dataDir, "poem-index.json")}`);

    // Add poem database indexes for efficient querying
    await Poem.collection.createIndexes([
      {
        key: {
          title: "text",
          author: "text",
          dynasty: "text",
          "lines.chinese": "text",
          explanation: "text",
        },
      },
      { key: { author: 1 } },
      { key: { dynasty: 1 } },
    ]);

    console.log("MongoDB text indexes created for efficient poem searches");
  } catch (error) {
    console.error("Error indexing poem database:", error);
    throw error;
  }
}

/**
 * Generate the poem database context for the AI
 * This can be used to periodically update the AI's knowledge
 */
export async function generatePoemDatabaseContext(): Promise<string> {
  try {
    // Ensure we're connected to MongoDB
    await ensureMongoDBConnection();

    // Check if connection has a database
    if (!mongoose.connection.db) {
      console.error("MongoDB connection has no database");
      return "Error: MongoDB connection has no database";
    }

    // Find the collection with the most poems
    console.log("Searching for poem collections for context generation...");

    // Collection names to try
    const collectionNames = [
      "poems",
      "Poems",
      "poem",
      "Poem",
      "ChinesePoems",
      "chinesepoems",
    ];
    let maxCount = 0;
    let bestCollection = null;

    // Search all collections in the database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    // Check each potential poem collection
    for (const collName of collectionNames) {
      try {
        // Check if this collection exists
        if (collections.some((c) => c.name === collName)) {
          // Count documents in this collection
          const count = await mongoose.connection.db
            .collection(collName)
            .countDocuments();

          if (count > maxCount) {
            maxCount = count;
            bestCollection = collName;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // For collections not in our list, check if they might be poem collections
    for (const collection of collections) {
      if (!collectionNames.includes(collection.name)) {
        try {
          // Get a sample document to see if it looks like a poem
          const sample = await mongoose.connection.db
            .collection(collection.name)
            .findOne(
              {},
              { projection: { title: 1, author: 1, dynasty: 1, lines: 1 } }
            );

          if (
            sample &&
            (sample.title || sample.author || sample.dynasty || sample.lines)
          ) {
            // This looks like a poem collection
            const count = await mongoose.connection.db
              .collection(collection.name)
              .countDocuments();

            if (count > maxCount) {
              maxCount = count;
              bestCollection = collection.name;
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Use the best collection, or default to "Poem"
    let Poem: mongoose.Model<any>;
    if (bestCollection) {
      console.log(
        `Using collection '${bestCollection}' with ${maxCount} poems for context generation`
      );

      // Try to register the schema for this collection
      const lineSchema = new mongoose.Schema(
        {
          chinese: String,
          pinyin: String,
          translation: String,
          explanation: String,
        },
        { _id: false }
      );

      const poemSchema = new mongoose.Schema(
        {
          title: String,
          author: String,
          dynasty: String,
          lines: [lineSchema],
          explanation: String,
          historicalCulturalContext: String,
        },
        { timestamps: true }
      );

      // Use existing model or create new one
      try {
        Poem = mongoose.model(bestCollection);
      } catch (e) {
        Poem = mongoose.model(bestCollection, poemSchema, bestCollection);
      }
    } else {
      console.log(
        'No poem collections found, using default "Poem" model for context generation'
      );
      Poem = mongoose.model<TPoem & mongoose.Document>("Poem");
    }

    // Get basic statistics about the poem database
    const poemCount = await Poem.countDocuments();
    const dynastyCount = (await Poem.distinct("dynasty")).length;
    const authorCount = (await Poem.distinct("author")).length;

    // Read the index file if it exists
    let indexData: any = null;
    const indexPath = path.join(process.cwd(), "data", "poem-index.json");

    if (fs.existsSync(indexPath)) {
      indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    }

    // Generate a context string for the AI
    let context = `POEM DATABASE INFORMATION:\n\n`;
    context += `Total poems: ${poemCount}\n`;
    context += `Dynasties represented: ${dynastyCount}\n`;
    context += `Authors represented: ${authorCount}\n\n`;

    if (indexData) {
      context += `Dynasties: ${Object.keys(indexData.dynastyIndex).join(", ")}\n\n`;
      context += `Some notable authors:\n`;

      // List up to 10 authors with the most poems
      const authorEntries = Object.entries(indexData.authorIndex) as [
        string,
        string[],
      ][];
      authorEntries.sort((a, b) => b[1].length - a[1].length);

      authorEntries.slice(0, 10).forEach(([author, poems]) => {
        context += `- ${author}: ${poems.length} poems\n`;
      });
    } else {
      // If no index file, get some sample poems
      const samplePoems = await Poem.find({}, "title author dynasty")
        .limit(10)
        .lean();

      if (samplePoems.length > 0) {
        context += `Sample poems in database:\n`;
        samplePoems.forEach((poem: any) => {
          context += `- "${poem.title}" by ${poem.author} (${poem.dynasty})\n`;
        });
      }
    }

    return context;
  } catch (error) {
    console.error("Error generating poem database context:", error);
    return "Error generating poem database context";
  }
}

/**
 * Get all poem summaries from the database or index file
 * This is a fallback method to get poem data when a specific query fails
 */
export async function getAllPoemSummaries(): Promise<any[]> {
  try {
    // First try to read from the index file (faster)
    const indexPath = path.join(process.cwd(), "data", "poem-index.json");
    if (fs.existsSync(indexPath)) {
      const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      if (indexData && indexData.summaries && indexData.summaries.length > 0) {
        console.log(
          `Retrieved ${indexData.summaries.length} poem summaries from index file`
        );
        return indexData.summaries;
      }
    }

    // If index file doesn't exist or is empty, query the database
    await ensureMongoDBConnection();

    if (!mongoose.connection.db) {
      console.error("MongoDB connection has no database");
      return [];
    }

    // Find the collection with the most poems using the same logic as in indexPoemDatabase
    const collectionNames = [
      "poems",
      "Poems",
      "poem",
      "Poem",
      "ChinesePoems",
      "chinesepoems",
    ];
    let maxCount = 0;
    let bestCollection = null;

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    // Check each potential poem collection
    for (const collName of collectionNames) {
      try {
        if (collections.some((c) => c.name === collName)) {
          const count = await mongoose.connection.db
            .collection(collName)
            .countDocuments();
          if (count > maxCount) {
            maxCount = count;
            bestCollection = collName;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // For collections not in our list, check if they might be poem collections
    for (const collection of collections) {
      if (!collectionNames.includes(collection.name)) {
        try {
          const sample = await mongoose.connection.db
            .collection(collection.name)
            .findOne(
              {},
              { projection: { title: 1, author: 1, dynasty: 1, lines: 1 } }
            );

          if (
            sample &&
            (sample.title || sample.author || sample.dynasty || sample.lines)
          ) {
            const count = await mongoose.connection.db
              .collection(collection.name)
              .countDocuments();
            if (count > maxCount) {
              maxCount = count;
              bestCollection = collection.name;
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Use the best collection, or default to "Poem"
    let Poem: mongoose.Model<any>;
    if (bestCollection) {
      try {
        Poem = mongoose.model(bestCollection);
      } catch (e) {
        const lineSchema = new mongoose.Schema(
          {
            chinese: String,
            pinyin: String,
            translation: String,
            explanation: String,
          },
          { _id: false }
        );

        const poemSchema = new mongoose.Schema(
          {
            title: String,
            author: String,
            dynasty: String,
            lines: [lineSchema],
            explanation: String,
            historicalCulturalContext: String,
          },
          { timestamps: true }
        );

        Poem = mongoose.model(bestCollection, poemSchema, bestCollection);
      }
    } else {
      Poem = mongoose.model<TPoem & mongoose.Document>("Poem");
    }

    // Get all poems from the database
    const poems = await Poem.find().lean();

    // Create summary information
    const poemSummaries = poems.map((poem: any) => ({
      id: poem._id?.toString() || "",
      title: poem.title || "Untitled",
      author: poem.author || "Unknown",
      dynasty: poem.dynasty || "Unknown",
      firstLine: (poem.lines && poem.lines[0]?.chinese) || "",
      lineCount: poem.lines ? poem.lines.length : 0,
    }));

    console.log(
      `Retrieved ${poemSummaries.length} poem summaries from database`
    );
    return poemSummaries;
  } catch (error) {
    console.error("Error getting all poem summaries:", error);
    return [];
  }
}
