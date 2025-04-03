import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

/**
 * Custom middleware to handle errors for SSE (Server-Sent Events) streaming endpoints
 * This middleware will format errors in a way that can be sent as SSE data
 */
const streamErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the response headers have been set for streaming
  const isStreamingEndpoint =
    res.getHeader("Content-Type") === "text/event-stream" && !res.headersSent;

  if (!isStreamingEndpoint) {
    // If not a streaming endpoint, pass to next error handler
    return next(err);
  }

  // Get status code and error message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Stream processing failed";

  console.error(`Streaming Error [${statusCode}]:`, message);

  // Send error to client as SSE data
  res.write(
    `data: ${JSON.stringify({
      success: false,
      error: true,
      statusCode,
      message,
    })}\n\n`
  );

  // End the stream
  res.write("data: [DONE]\n\n");
  res.end();
};

export default streamErrorHandler;
