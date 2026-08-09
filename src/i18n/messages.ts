import en from "./en.json";
import de from "./de.json";
import ru from "./ru.json";
import type { Messages } from "./types";

export const messages = {
  en,
  de,
  ru,
} satisfies Record<string, Messages>;

export type MessageLanguage = keyof typeof messages;

export function getMessages(locale: MessageLanguage): Messages {
  return messages[locale] ?? messages.en;
}
