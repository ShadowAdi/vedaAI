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

    const prompt = `You are an expert educator creating an assessment paper. Your response will be automatically parsed by a strict JSON parser. ANY malformed JSON will cause the entire request to FAIL. This is non-negotiable.

**ASSIGNMENT DETAILS:**
- Title: ${data.title}
- Due Date: ${data.dueDate}
- Question Types Required: ${questionTypesArray.join(", ")}
- Total Questions to Generate: EXACTLY ${data.numberOfQuestions} questions
- Total Marks for Assessment: EXACTLY ${data.totalMarks} marks
- Difficulty Breakdown Expected: ~${easyCount} easy, ~${mediumCount} medium, ~${hardCount} hard
${data.additionalInstructions ? `- Special Instructions: ${data.additionalInstructions}` : ""}

**SOURCE CONTENT FOR QUESTIONS:**
${contextPreview}

===== ABSOLUTE REQUIREMENTS - NON-NEGOTIABLE =====
1. Your response MUST be ONLY valid JSON. Nothing else.
2. JSON must be complete and parseable (not truncated).
3. Do NOT close the response early. Generate the FULL JSON structure.
4. VERIFY JSON validity before responding (mentally test with JSON.parse).

===== CRITICAL - NO THESE =====
- NO markdown code blocks
- NO explanatory text before or after JSON
- NO preamble, commentary, or trailing text
- NO comments inside JSON
- NO incomplete JSON or truncated responses
- NO extra commas or syntax errors
- NO newlines or text AFTER the closing }

===== YES ONLY THIS =====
- ONLY raw JSON object starting with { and ending with }
- Complete, valid JSON that can be parsed
- All required fields present in every object
- All marks and question counts exactly as specified

===== EXACT JSON STRUCTURE (REQUIRED) =====
{
  "sections": [
    {
      "title": "Section A (Short Answer Questions)",
      "instruction": "Answer all questions in this section",
      "questions": [
        {
          "text": "Complete question with all context. Do not abbreviate.",
          "difficulty": "easy",
          "marks": 2
        },
        {
          "text": "Another complete question with full context and details?",
          "difficulty": "medium",
          "marks": 3
        }
      ]
    },
    {
      "title": "Section B (Problem Solving)",
      "instruction": "Solve all problems showing necessary steps",
      "questions": [
        {
          "text": "Problem with all given values and required calculations?",
          "difficulty": "hard",
          "marks": 5
        }
      ]
    }
  ]
}

===== STRICT GENERATION RULES =====
1. Generate EXACTLY ${data.numberOfQuestions} questions - count them before responding
2. Distribute across 2-3 sections based on question types
3. Total marks MUST equal EXACTLY ${data.totalMarks} - calculate and verify
4. Difficulty distribution: approximately ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard
5. Each question MUST have: "text" (complete), "difficulty" (easy/medium/hard), "marks" (number)
6. Marks per question: typically 1-5 (must sum to ${data.totalMarks})
7. difficulty values MUST be lowercase: "easy", "medium", or "hard" (NEVER capitalized)
8. marks MUST be a number (integer), NOT a string
9. text MUST be complete, unambiguous, and self-contained
10. No empty questions or sections
11. No partial text or truncation - every question must be complete
12. Ensure JSON is valid - would pass JSON.parse()

===== MARKS DISTRIBUTION EXAMPLE =====
For ${data.numberOfQuestions} questions with ${data.totalMarks} total marks:
- Distribute as: 2, 3, 2, 3, 4, 5 marks (etc.) to reach exact total
- Calculate marks carefully before responding
- Example: ${data.numberOfQuestions} questions requires ~${(data.totalMarks / data.numberOfQuestions).toFixed(1)} marks per question

===== VALIDATION BEFORE RESPONDING =====
Count and verify:
- Total questions: ${data.numberOfQuestions}?
- Total marks: ${data.totalMarks}?
- All questions have text, difficulty, marks?
- All difficulties are lowercase?
- No markdown, comments, or extra text?
- JSON is complete and parseable?

===== SECTION GUIDELINES =====
- Create 2-3 sections (no more)
- Use clear, descriptive titles
- Each section has instruction text for students
- Group related question types together
- Vary difficulty across sections

===== IF YOU RUN OUT OF CONTENT =====
If the document is short, generate logical follow-up questions based on the topic. Ensure all questions are coherent and related to the assignment title.

START JSON RESPONSE NOW (start with { immediately, no text before):`;

    return prompt;
};