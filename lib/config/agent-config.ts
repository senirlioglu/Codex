export const agentConfig = {
  alwaysUseBrowserFor: ["hepsiburada.com"],
  forceBrowserAgent: process.env.FORCE_BROWSER_AGENT === "true"
};

export function shouldUseBrowserAgent(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    agentConfig.forceBrowserAgent ||
    agentConfig.alwaysUseBrowserFor.some((domain) => host === domain || host === `www.${domain}`)
  );
}
