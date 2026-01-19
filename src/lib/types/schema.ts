import z from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  description: z.string().min(2, 'Description must be at least 2 characters long'),
})

export const sprintSchema = z.object({
  name: z.string().min(2, 'Sprint name must be at least 2 characters long'),
  startDate: z.union([
    z.date(),
    z.string()
  ]),

  endDate: z.union([
    z.date(),
    z.string()
  ])
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const testCycleSchema = z
  .object({
    title: z
      .string()
      .min(2, "Test Cycle title must be at least 2 characters long"),

    startDate: z.union([
      z.date(),
      z.string().min(1, "Start date is required"),
    ]),

    endDate: z.union([
      z.date(),
      z.string().min(1, "End date is required"),
    ]),
  })
  .refine(
    (data) =>
      new Date(data.endDate).getTime() >=
      new Date(data.startDate).getTime(),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
