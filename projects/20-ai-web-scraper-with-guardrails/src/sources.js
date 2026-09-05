export const defaultSources = [
  {
    id: "local-ai-news",
    type: "fixture",
    path: "ai-news.html",
    allowedContentDomains: ["example.com", "research.example.com"]
  }
];

export const approvedRemoteHosts = new Set([
  "example.com",
  "research.example.com"
]);
