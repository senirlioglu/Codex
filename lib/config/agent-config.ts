const alwaysUseBrowserForEnv = (process.env.ALWAYS_USE_BROWSER_FOR ?? "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

export const agentConfig = {
  alwaysUseBrowserFor: alwaysUseBrowserForEnv,
  forceBrowserAgent: process.env.FORCE_BROWSER_AGENT === "true"
};

export function shouldUseBrowserAgent(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    agentConfig.forceBrowserAgent ||
    agentConfig.alwaysUseBrowserFor.some((domain) => host === domain || host === `www.${domain}`)
  );
}
