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

export const sqlSchemaFileSchema = z.object({
  file: z
    .string()
    .refine((value) => {
      return value.length > 0;
    }, "Please select a file")
    .refine((value) => {
      return value.endsWith(".sql");
    }, "File must be an SQL schema file"),
});
