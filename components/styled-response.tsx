import React from "react";

export const StyledResponse = ({ response }: { response: string }) => {
  const parts = response.split(/(```[\s\S]*?```)/);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).trim();
          const language = code.split("\n")[0];
          const codeContent = code.split("\n").slice(1).join("\n");

          return (
            <pre key={index} className="bg-gray-800 rounded-md p-4 overflow-x-auto">
              <code className="text-sm text-gray-200">{codeContent}</code>
            </pre>
          );
        } else {
          return (
            <p key={index} className="text-gray-700">
              {part}
            </p>
          );
        }
      })}
    </div>
  );
};
