export class BotBlockedError extends Error {
  constructor(message = "Bot/captcha engeli nedeniyle istek tamamlanamadı") {
    super(message);
    this.name = "BotBlockedError";
  }
}

export function detectBotBlocking(html: string): boolean {
  const lower = html.toLowerCase();
  return ["captcha", "robot", "bot doğrulama", "are you human", "security check"].some((token) =>
    lower.includes(token)
  );
}
