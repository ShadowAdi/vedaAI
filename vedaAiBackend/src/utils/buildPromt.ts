import { AssignmentJobPayload } from "../interface/assignment-job.payload.js";

export const buildPrompt = (data: AssignmentJobPayload["data"], context: string): string => {
  const hasContent = context && context.trim().length > 0;

  // Ensure questionTypes is an array
  const questionTypesArray = Array.isArray(data.questionTypes)
    ? data.questionTypes
    : typeof data.questionTypes === 'string'
      ? [data.questionTypes]
      : [];

  // Calculate expected difficulty counts
  const easyCount = Math.ceil(data.numberOfQuestions * 0.3);
  const mediumCount = Math.ceil(data.numberOfQuestions * 0.5);
  const hardCount = Math.max(1, data.numberOfQuestions - easyCount - mediumCount);

  const contextPreview = hasContent
    ? `${context.substring(0, 3000)}${context.length > 3000 ? '\n\n[Content truncated - use key concepts from above]' : ''}`
    : "No document provided. Generate original, coherent questions based on the title and related subject matter. Ensure questions are self-contained and don't require external knowledge beyond the topic.";

  const prompt = `You are a JSON-only API. Output ONLY a raw JSON object, nothing else.

ASSIGNMENT:
- Title: ${data.title}
- Due Date: ${data.dueDate}  
- Question Types: ${questionTypesArray.join(", ")}
- Total Questions: EXACTLY ${data.numberOfQuestions}
- Total Marks: EXACTLY ${data.totalMarks}
- Difficulty: ~${easyCount} easy, ~${mediumCount} medium, ~${hardCount} hard
${data.additionalInstructions ? `- Instructions: ${data.additionalInstructions}` : ""}

SOURCE CONTENT:
${contextPreview}

OUTPUT FORMAT (raw JSON, no markdown, no text before or after):
{
  "sections": [
    {
      "title": "Section A (Multiple Choice)",
      "instruction": "Choose the best answer",
      "questions": [
        { "text": "...", "difficulty": "easy", "marks": 1 }
      ]
    }
  ]
}

Rules:
- Exactly ${data.numberOfQuestions} questions, marks summing to ${data.totalMarks}
- difficulty must be lowercase: "easy", "medium", or "hard"
- marks must be integers
- 2-3 sections grouped by question type
- Start with { immediately`;

  return prompt;
};