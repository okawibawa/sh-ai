"use server";

import { ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { getCookie, setCookie } from "cookies-next";
import { cookies } from "next/headers";

import { fileFormSchema } from "@/dtos";

interface queryGeneratorState {
  message: string;
  status?: "success" | "error" | "";
  data?: any;
  mode?: "insert" | "query" | "";
}

export const queryGeneratorAction = async (
  previousState: queryGeneratorState,
  formData: FormData
): Promise<queryGeneratorState> => {
  const data = Object.fromEntries(formData);
  const mode = data.mode as "insert" | "query";

  try {
    const parseData = fileFormSchema.safeParse(data);

    const openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o",
    });

    if (mode === "insert") {
      if (!parseData.success) {
        return { message: "Validation error." };
      }

      const fileContent = (await parseData.data.file) as File;
      const schema = await fileContent.text();

      const splitCharacter = async (content: string) => {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 2500,
          chunkOverlap: 300,
        });

        return await splitter.createDocuments([content]);
      };

      const document = await splitCharacter(schema);

      cookies().set("document", JSON.stringify(document));

      return {
        status: "success",
        mode: "insert",
        message: "Schema read successfully!",
      };
    }

    if (mode === "query") {
      const query = data.query as string;
      const document = cookies().get("document");

      if (!document) {
        return { status: "error", message: "An internal problem occurred." };
      }

      const parsedDocument = JSON.parse(document?.value);

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are an excellent database admin."],
        ["system", "You are gifted with these sacred SQL schema: {schema}"],
        [
          "system",
          "Please pay attention to details of the schema; the relations, the columns name, data type, etc.",
        ],
        ["system", "Always adjust your answer with the user's request, and the schema details."],
        ["system", "You are going to answer people who ask about database query."],
        [
          "system",
          `For example, when people ask how to get all eSIM plans, you'd give answer like, "select * from esims"`,
        ],
        [
          "system",
          `Another example, if people ask how to get all eSIM plans based on a certain country code, you'd give answer like, "select e.*, c.name from esims e join countries c on e.country_code = c.code where e.country_code ='JP'"`,
        ],
        [
          "system",
          "Every time you give out query answers, always ask if your answer works and if the user have any other question.",
        ],
        [
          "system",
          "If people's request does not fit the schema, you let them know. Give them suggestion on what they should do but don't ask if they need help.",
        ],
        ["system", "If people's request is unclear, ask them to elaborate."],
        ["user", "{question}"],
      ]);

      const chain = RunnableSequence.from([
        {
          schema: async () =>
            parsedDocument
              .map((document: { pageContent: string }) => document.pageContent)
              .join("\n"),
          question: new RunnablePassthrough(),
        },
        promptTemplate,
        openai,
        new StringOutputParser(),
      ]);

      const result = await chain.invoke(query);

      return {
        status: "success",
        mode: "query",
        message: "Query incoming...",
        data: result,
      };
    }

    return { status: "error", message: "Invalid mode." };
  } catch (error) {
    throw error;
  }
};
