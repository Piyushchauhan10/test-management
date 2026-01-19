import z from "zod";
import type { projectSchema, sprintSchema,testCycleSchema, } from "./schema";

export type Project = z.infer<typeof projectSchema>;
export type Sprint = z.infer<typeof sprintSchema>;
export type TestCycle = z.infer<typeof testCycleSchema>;