import { isBlankBio } from "./bio-writes";

export interface PlainTextTranslationInput {
  sourceText: string;
  sourceName: string;
  targetCode: string;
  targetName: string;
  currentText?: string;
}

export function buildPlainTextTranslationMessages(
  input: PlainTextTranslationInput,
): Array<{ role: string; content: string }> {
  const currentText = String(input.currentText ?? "").trim();
  if (!isBlankBio(currentText)) {
    return [
      {
        role: "system",
        content:
          "Improve the existing translation using the original as the source of truth. Return only the translated text. Keep names like AfroUp. Do not add quotes or explanations.",
      },
      {
        role: "user",
        content: `Original ${input.sourceName} text:\n${input.sourceText}\n\nCurrent ${input.targetName} (${input.targetCode}) draft to improve:\n${currentText}`,
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "Translate the user text faithfully. Return only the translated text. Keep names like AfroUp. Do not add quotes or explanations.",
    },
    {
      role: "user",
      content: `Translate this ${input.sourceName} text into ${input.targetName} (${input.targetCode}):\n${input.sourceText}`,
    },
  ];
}
