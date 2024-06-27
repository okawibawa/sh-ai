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

export const fileListFormSchema = z.object({
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

export const fileFormSchema = z.object({
  file: z
    .any()
    .refine((file) => file instanceof File, { message: "File is required." })
    .refine((file) => file?.name?.endsWith(".sql"), {
      message: "Must be an SQL schema file.",
    }),
});
