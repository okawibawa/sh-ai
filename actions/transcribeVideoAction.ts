"use server";

import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import path from "path";
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";
import fs from "fs";
import { nanoid } from "nanoid";
import { Tool } from "@langchain/core/tools";

import { urlFormSchema } from "@/dtos";

interface transcribeVideoState {
  message: string;
  fields?: Record<string, string>;
  status?: "success" | "error";
  data?: any;
}

// Ensure Tool is not tree-shaken
// In other words; DO NOT TOUCH THIS
Object.assign(global, { _langChainTool: Tool });

const CONTENT_TOO_LONG_ERRORS = [
  "Content is too long. I am not that powerful yet 😅 Less than 13 mins is preferable.",
  "Your content is way too long. What are you transcribing? Less than 13 mins is preferable.",
  "Alright calm down now. Whatever that is you put in is too long. Less than 13 mins is preferable.",
  "Your content is too long I'm not transcribing all that. Less than 13 mins is preferable.",
  "Your content is too long I'm tired. Less than 13 mins is preferable.",
];

export const transcribeVideoAction = async (
  previousState: transcribeVideoState,
  formData: FormData,
): Promise<transcribeVideoState> => {
  const data = Object.fromEntries(formData);
  const uid = nanoid(4);
  const parseData = urlFormSchema.safeParse(data);

  if (!parseData.success) {
    const fields: Record<string, string> = {};

    for (const key of Object.keys(data)) {
      fields[key] = data[key].toString();
    }

    return { message: "Validation error.", fields };
  }

  try {
    const downloadYouTubeAudio = async (
      url: string,
    ): Promise<transcribeVideoState> => {
      try {
        const videoInfo = await ytdl.getInfo(url);

        if (parseInt(videoInfo.videoDetails.lengthSeconds) > 780) {
          return {
            status: "error",
            message:
              CONTENT_TOO_LONG_ERRORS[
                Math.floor(Math.random() * CONTENT_TOO_LONG_ERRORS.length)
              ],
          };
        }

        const stream = ytdl(url, { filter: "audioonly" });

        return {
          status: "success",
          message: "Streaming data success.",
          data: stream,
        };
      } catch (error) {
        return {
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const splitAndConvertWav = async (
      audioStream: transcribeVideoState,
      segmentDuration: number = 180,
    ): Promise<string[]> => {
      const outputDir = path.join(process.cwd(), "public", "audio");
      const outputPaths: string[] = [];
      const stream = audioStream.data as Readable;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
          recursive: true,
        });
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(stream)
          .outputOptions([
            `-f segment`,
            `-segment_time ${segmentDuration}`,
            `-reset_timestamps 1`,
          ])
          .output(`${outputDir}/segment_${uid}_%03d.wav`)
          .audioCodec("pcm_s16le")
          .audioChannels(1)
          .audioFrequency(16000)
          .on("error", (err) => {
            console.error("An error occurred while splitting: ", err);
            reject(err);
          })
          .on("progress", () => {
            console.log(`Processing.`);
          })
          .on("end", () => {
            console.log("Audio splitting finished!");
            resolve();
          })
          .run();
      });

      const segments = fs
        .readdirSync(outputDir)
        .filter(
          (segment) =>
            segment.startsWith("segment") &&
            segment.endsWith(".wav") &&
            segment.includes(uid),
        );
      outputPaths.push(
        ...segments.map((segment) => path.join(outputDir, segment)),
      );

      return outputPaths;
    };

    const transcribeAudio = async (filePath: string): Promise<string> => {
      const loader = new OpenAIWhisperAudio(filePath, {
        clientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      });

      const docs = await loader.load();

      return docs[0].pageContent;
    };

    const videoBuffer = await downloadYouTubeAudio(parseData.data.url);

    if ((videoBuffer as transcribeVideoState).status === "error") {
      return {
        status: (videoBuffer as transcribeVideoState).status,
        message: (videoBuffer as transcribeVideoState).message,
      };
    }

    const segmentPaths = await splitAndConvertWav(videoBuffer);

    let fullTranscription = "";

    for (const segmentPath of segmentPaths) {
      const segmentTranscription = await transcribeAudio(segmentPath);
      fullTranscription += segmentTranscription;

      fs.unlinkSync(segmentPath);
    }

    return { message: fullTranscription.trim() };
  } catch (error) {
    throw error;
  }
};
