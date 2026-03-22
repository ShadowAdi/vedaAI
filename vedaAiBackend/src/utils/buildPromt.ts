import { AssignmentJobPayload } from "../interface/assignment-job.payload.js";

export const buildPrompt = (data: AssignmentJobPayload["data"], context: string): string => {
    const hasContent = context && context.trim().length > 0;
    
    return `You are an expert educator creating an assessment paper. Your response will be automatically parsed by a JSON parser, so it MUST be valid JSON.

**ASSIGNMENT DETAILS:**
- Title: ${data.title}
- Due Date: ${data.dueDate}
- Question Types Required: ${data.questionTypes.join(", ")}
- Total Questions to Generate: EXACTLY ${data.numberOfQuestions} questions
- Total Marks for Assessment: EXACTLY ${data.totalMarks} marks
${data.additionalInstructions ? `- Special Instructions: ${data.additionalInstructions}` : ""}

**SOURCE CONTENT FOR QUESTIONS:**
${hasContent ? context : "No document provided. Generate questions based on the title and general knowledge related to the topic."}

===== CRITICAL - RESPONSE FORMAT =====
Return ONLY valid JSON. Nothing else. Zero tolerance.
- ❌ NO markdown code blocks (no \`\`\`json, no \`\`\`)
- ❌ NO explanatory text, preamble, or commentary
- ❌ NO trailing text after the JSON
- ❌ NO comments inside JSON
- ✅ ONLY raw, parseable JSON object starting with { and ending with }

===== EXACT JSON STRUCTURE =====
{
  "sections": [
    {
      "title": "Section A (e.g., Short Answer Questions)",
      "instruction": "Answer all questions in this section",
      "questions": [
        {
          "text": "What is the complete question? Include all context needed.",
          "difficulty": "easy",
          "marks": 2
        },
        {
          "text": "Another complete question with full context?",
          "difficulty": "medium",
          "marks": 3
        }
      ]
    },
    {
      "title": "Section B (e.g., Numerical Problems)",
      "instruction": "Solve all numerical problems in this section",
      "questions": [
        {
          "text": "Problem statement with all necessary values and context?",
          "difficulty": "medium",
          "marks": 4
        }
      ]
    }
  ]
}

===== STRICT GENERATION RULES =====
1. Generate EXACTLY ${data.numberOfQuestions} questions (not more, not less)
2. Distribute across 2-3 sections based on question types
3. Total marks across ALL questions MUST equal EXACTLY ${data.totalMarks}
4. Difficulty distribution: ~30% easy, ~50% medium, ~20% hard
5. Marks per question: typically 2-5 marks (total must equal ${data.totalMarks})
6. Each field MUST exist: "text", "difficulty", "marks"
7. difficulty MUST be one of: "easy", "medium", "hard" (lowercase only)
8. marks MUST be a number (integer), not a string
9. text MUST be complete, clear, and self-contained
10. No empty questions or sections allowed

===== VALIDATION CHECKLIST =====
Before responding, verify:
- [ ] Exactly ${data.numberOfQuestions} questions total
- [ ] All marks sum to ${data.totalMarks} (${data.numberOfQuestions} questions, ${data.totalMarks} marks)
- [ ] All questions have text, difficulty, and marks
- [ ] All difficulty values are lowercase: easy, medium, or hard
- [ ] All marks are numbers, not strings
- [ ] Valid JSON structure (test with JSON.parse)
- [ ] No markdown code blocks
- [ ] No text before or after the JSON object

===== SECTION GUIDELINES =====
- 2-3 sections maximum
- Each section should have a clear title and instruction
- Distribute different question types across sections logically
- Example titles: "Short Answer Questions", "Numerical Problems", "Problem Solving", "Conceptual Questions", "Applied Questions"

START JSON HERE (no preamble):`;
}