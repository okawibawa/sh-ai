"use server";

import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { Tool } from "@langchain/core/tools";
import { OpenAI } from "openai";

import { urlFormSchema } from "@/dtos";
import { headers } from "next/headers";

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeVideoAction = async (
  previousState: transcribeVideoState,
  formData: FormData,
): Promise<transcribeVideoState> => {
  const headersList = headers();
  const rateLimitExceeded = headersList.get("X-RateLimit-Exceeded");

  if (rateLimitExceeded === "true") {
    return {
      message: "Rate limit exceeded. Please try again in a few seconds.",
      status: "error",
      data: null,
    };
  }

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
          .audioCodec("pcm_s16le")
          .audioChannels(1)
          .audioFrequency(16000)
          .output(`${outputDir}/segment_${uid}_%03d.wav`)
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

    const transcribeAudio = async (filePath: string): Promise<any> => {
      const audioFile = fs.createReadStream(filePath);

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      console.log(transcription);

      return transcription;
    };

    const videoBuffer = await downloadYouTubeAudio(parseData.data.url);

    if ((videoBuffer as transcribeVideoState).status === "error") {
      return {
        status: (videoBuffer as transcribeVideoState).status,
        message: (videoBuffer as transcribeVideoState).message,
      };
    }

    const segmentPaths = await splitAndConvertWav(videoBuffer);

    for (const segmentPath of segmentPaths) {
      const segmentTranscription = await transcribeAudio(segmentPath);

      console.log(segmentTranscription);

      fs.unlinkSync(segmentPath);
    }

    return { status: "success", message: "" };
  } catch (error) {
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
