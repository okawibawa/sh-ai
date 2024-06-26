"use server";

import { z } from "zod";
import { OpenAI } from "@langchain/openai";

interface transcribeVideoState {
  message: string;
  fields?: Record<string, string>;
}

const urlFormSchema = z.object({
  url: z
    .string()
    .trim()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})(\?.*)?$/,
      {
        message: "Must be a valid URL (HTTPS).",
      },
    ),
});

export const transcribeVideoAction = async (
  previousState: transcribeVideoState,
  formData: FormData,
): Promise<transcribeVideoState> => {
  const data = Object.fromEntries(formData);

  const parseData = urlFormSchema.safeParse(data);

  if (!parseData.success) {
    const fields: Record<string, string> = {};

    for (const key of Object.keys(data)) {
      fields[key] = data[key].toString();
    }

    return { message: "Validation error.", fields };
  }

  try {
    const model = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4o",
    });

    console.log({ model });

    return { message: "ok" };
  } catch (error) {
    throw error;
  }
};
