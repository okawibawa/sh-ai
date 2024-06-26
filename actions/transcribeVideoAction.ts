"use server";

import { z } from "zod";
import { OpenAI } from "@langchain/openai";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import path from "path";
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";

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
      }
    ),
});

export const transcribeVideoAction = async (
  previousState: transcribeVideoState,
  formData: FormData
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const downloadYouTubeAudio = async (url: string): Promise<Readable> => {
      return ytdl(url, { filter: "audioonly" });
    };

    const convertToWav = (audioStream: Readable, outputPath: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        ffmpeg(audioStream)
          .toFormat("wav")
          .on("error", (err) => {
            console.error("An error occurred: ", err);
            reject(err);
          })
          .on("progress", (progress) => {
            console.log(`Processing: ${progress.targetSize}KB`);
          })
          .on("end", () => {
            console.log("Processing finished!");
            resolve();
          })
          .save(outputPath);
      });
    };

    const videoBuffer = await downloadYouTubeAudio(parseData.data.url);
    await convertToWav(videoBuffer, path.join(process.cwd(), "public", "audio", "audio.wav"));
    const loader = new OpenAIWhisperAudio(
      path.join(process.cwd(), "public", "audio", "audio.wav"),
      {
        clientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      }
    );
    const docs = await loader.load();

    return { message: docs[0].pageContent };
  } catch (error) {
    throw error;
  }
};
