import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import { analyzePoem } from "./ai-analyze.service";

export const analyze = catchAsync(async (req: Request, res: Response) => {
  const { poemId } = req.params;
  const { language = "en" } = req.query;

  const analysis = await analyzePoem(poemId, language as string);

  res.status(200).json({
    status: "success",
    data: analysis,
  });
});
