/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
import app from "./app";
import config from "./app/config";
import dbConnect from "./app/utils/dbConnect";

async function main() {
  try {
    // Connect to database
    await dbConnect();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
