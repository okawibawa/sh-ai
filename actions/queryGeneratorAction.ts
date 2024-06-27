import { ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { fileFormSchema } from "@/dtos";

interface queryGeneratorState {
  message: string;
  status?: "success" | "error";
  data?: any;
}

export const queryGeneratorAction = async (
  previousState: queryGeneratorState,
  formData: FormData
): Promise<queryGeneratorState> => {
  const data = Object.fromEntries(formData);

  const parseData = fileFormSchema.safeParse(data);

  if (!parseData.success) {
    return { message: "Validation error." };
  }

  try {
    const readFile = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);

        reader.readAsText(file);
      });
    };

    const splitCharacter = async (content: string) => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2500,
        chunkOverlap: 200,
      });

      return await splitter.createDocuments([content]);
    };

    const rawContent = (await readFile(parseData.data.file)) as string;
    const document = await splitCharacter(rawContent);

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "You are an excellent database admin."],
      ["system", "You are gifted with these sacred SQL schema: {schema}"],
      ["system", "You are going to answer people who ask about how to query a database."],
      [
        "system",
        `For example, when people ask how to get all eSIM plans, you'd give answer like, "select * from esims"`,
      ],
      [
        "system",
        `And when people ask how to get all eSIM plans based on a certain country code, you'd give answer like, "select e.*, c.name from esims e join countries c on e.country_code = c.code where e.country_code ='JP'"`,
      ],
      [
        "system",
        "Every time you give out query answers, always ask if your answer works and if the user have any other question.",
      ],
      ["user", "{question}"],
    ]);

    const formattedChatPrompts = await promptTemplate.formatMessages({
      schema: document[0].pageContent,
      question: "How do i get all users?",
    });

    return { message: "ok" };
  } catch (error) {
    throw error;
  }
};
