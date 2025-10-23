
import { GoogleGenAI } from "@google/genai";
import type { Schema } from '../types';

const formatSchemaForPrompt = (schema: Schema): string => {
  return schema.map(table =>
    `-- Table: ${table.name}\n-- Columns: ${table.columns.map(col => `${col.name} (${col.type})`).join(', ')}`
  ).join('\n');
};

export const generateSqlFromNaturalLanguage = async (schema: Schema, question: string): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const formattedSchema = formatSchemaForPrompt(schema);

  const prompt = `
You are an expert SQLite3 database engineer.
Given the following database schema, write a valid SQLite3 query to answer the user's question.

**IMPORTANT**: Only output the raw SQL query. Do not include any explanations, markdown formatting (like \`\`\`sql), or anything other than the SQL code itself.

Schema:
${formattedSchema}

User's Question:
${question}

SQL Query:
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    let sqlQuery = response.text.trim();

    // Clean up potential markdown code block fences
    if (sqlQuery.startsWith('```sql')) {
      sqlQuery = sqlQuery.substring(5);
    }
    if (sqlQuery.startsWith('```')) {
      sqlQuery = sqlQuery.substring(3);
    }
    if (sqlQuery.endsWith('```')) {
      sqlQuery = sqlQuery.slice(0, -3);
    }

    return sqlQuery.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate SQL from the AI model.");
  }
};
