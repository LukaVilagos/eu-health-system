import { z } from "zod";

export const DefaultSchema = z.object({
  id: z.string(),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
  deletedAt: z.date().nullable().default(null),
});

export const CreateDocumentSchema = z.object({
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
  deletedAt: z.date().nullable().default(null),
});
