import { z } from "zod";

export const urlFormSchema = z.object({
  url: z
    .string()
    .trim()
    .url({ message: "Must be a valid URL." })
    .refine((url) => url.startsWith("https://"), {
      message: "URL must use HTTPS protocol.",
    })
    .refine(
      (url) => {
        const youtubeRegex =
          /^(https:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})(\?.*)?$/;
        return youtubeRegex.test(url);
      },
      { message: "Must be a valid YouTube URL." }
    ),
});

export const queryGeneratorBaseSchema = z.object({
  mode: z.enum(["insert", "query"]).default("insert"),
});

export const fileListFormSchema = queryGeneratorBaseSchema.extend({
  file: z
    .any()
    .refine((files) => files instanceof FileList && files.length > 0, {
      message: "File is required",
    })
    .refine(
      (files) => files instanceof FileList && files.length > 0 && files[0]?.name.endsWith(".sql"),
      { message: "Must be an SQL schema file." }
    ),
});

export const fileFormSchema = queryGeneratorBaseSchema.extend({
  file: z
    .any()
    .refine((file) => file instanceof File, { message: "File is required." })
    .refine((file) => file?.name?.endsWith(".sql"), {
      message: "Must be an SQL schema file.",
    }),
});

export const queryFormSchema = queryGeneratorBaseSchema.extend({
  query: z
    .string({ message: "Please insert a coherent query." })
    .trim()
    .min(1, { message: "Please insert your query." }),
});
