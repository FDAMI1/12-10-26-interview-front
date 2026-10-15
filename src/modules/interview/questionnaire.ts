import { McqQuestion } from "@modules/interview/types";

/**
 * The standard candidate questionnaire: self-assessment, so no option is
 * "correct". The candidate's choice is stored in `correctIndex`, and the
 * interviewer uses the answers as background to calibrate and probe.
 */
const QUESTIONNAIRE: { text: string; options: string[] }[] = [
  {
    text: "Which field best describes your current or most recent work?",
    options: [
      "Software development / IT",
      "Sales / Marketing",
      "Finance / Accounting",
      "Operations / Management",
      "Design / Creative work",
      "Other field",
    ],
  },
  {
    text: "How many years of professional experience do you have in this field?",
    options: [
      "No professional experience yet",
      "Less than 1 year",
      "1–3 years",
      "4–6 years",
      "7–10 years",
      "More than 10 years",
    ],
  },
  {
    text: "What best describes your current professional status?",
    options: [
      "Student / Learner",
      "Fresher seeking my first job",
      "Intern / Trainee",
      "Working professional",
      "Freelancer / Consultant",
      "Business owner",
    ],
  },
  {
    text: "How often do you perform tasks related to your field?",
    options: [
      "Only while learning",
      "Occasionally for practice",
      "Daily as part of my job",
      "Weekly as part of my job",
      "I manage or supervise others doing the work",
    ],
  },
  {
    text: "How would you rate your knowledge of the core concepts in your field?",
    options: [
      "I am still learning the basics",
      "I understand basic concepts",
      "I can apply concepts independently",
      "I can solve complex problems",
      "I can guide others and make expert decisions",
    ],
  },
  {
    text: "How many real-world projects or assignments have you completed?",
    options: [
      "None yet",
      "1–2 practice projects",
      "3–5 projects",
      "6–10 projects",
      "More than 10 projects",
    ],
  },
  {
    text: "When you face an unfamiliar problem in your field, what do you usually do?",
    options: [
      "Need step-by-step guidance",
      "Search for a tutorial and follow it",
      "Solve it independently using documentation",
      "Compare several solutions and choose the best",
      "Design a solution and help others implement it",
    ],
  },
  {
    text: "Which responsibility best matches your work?",
    options: [
      "Learning and assisting",
      "Completing assigned tasks with guidance",
      "Handling tasks independently",
      "Owning projects or important deliverables",
      "Leading a team or setting strategy",
    ],
  },
  {
    text: "How do you keep your knowledge up to date?",
    options: [
      "I have not started yet",
      "I learn when a task requires it",
      "I regularly take courses or practice",
      "I follow industry updates and apply new methods",
      "I research, experiment, mentor others, or define best practices",
    ],
  },
  {
    text: "Which statement best reflects your achievements in this field?",
    options: [
      "I have learned introductory concepts",
      "I have completed training or personal projects",
      "I have delivered work with some supervision",
      "I have independently delivered multiple real-world outcomes",
      "I have led major projects, improved processes, or mentored professionals",
    ],
  },
];

/** A fresh, unanswered copy. */
export const questionnaire = (): McqQuestion[] =>
  QUESTIONNAIRE.map((q) => ({
    text: q.text,
    options: [...q.options],
    correctIndex: -1,
  }));
