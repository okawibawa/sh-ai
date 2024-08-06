"use server";

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

import { fileFormSchema } from "@/dtos";

interface queryGeneratorState {
  message: string;
  status?: "success" | "error" | "";
  data?: any;
  mode?: "insert" | "query" | "";
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const embedding = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-ada-002",
});

export const queryGeneratorAction = async (
  previousState: queryGeneratorState,
  formData: FormData,
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
          chunkSize: 2000,
          chunkOverlap: 500,
        });

        return await splitter.createDocuments([content]);
      };

      const documents = await splitCharacter(schema);

      await SupabaseVectorStore.fromDocuments(documents, embedding, {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      });

      return {
        status: "success",
        mode: "insert",
        message: "Schema read successfully!",
      };
    }

    if (mode === "query") {
      const query = data.query as string;

      const vectorStore = new SupabaseVectorStore(embedding, {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      });

      const relevantDocuments = await vectorStore.similaritySearchWithScore(
        query,
        3,
      );

      if (relevantDocuments.length === 0) {
        return { status: "error", message: "No relevant documents found." };
      }

      const context = relevantDocuments
        .map(([document, _]) => document.pageContent)
        .join("\n");

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are an excellent database admin."],
        ["system", "You are gifted with these sacred SQL schema: {context}"],
        [
          "system",
          "Please pay attention to details of the schema; the relations, the columns name, data type, etc.",
        ],
        [
          "system",
          "Please also read the comments in the schema, if any, and use it to understand the schema better.",
        ],
        [
          "system",
          "Always adjust your answer with the user's request, and the schema details.",
        ],
        [
          "system",
          "You are going to answer people who ask about database query.",
        ],
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
          context: async () => context,
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
