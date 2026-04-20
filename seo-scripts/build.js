const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load config from site.config.json if exists
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'site.config.json');

let siteConfig = {};
if (fs.existsSync(configPath)) {
  try {
    siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    // Ignore config parse errors
  }
}

async function run() {
  try {
    const { main: convertBlog } = await import("./convert-blog-to-html.mjs");
    await convertBlog(siteConfig);
  } catch (error) { }

  try {
    execSync("node seo-scripts/generate-sitemap.js", { stdio: "pipe" });
  } catch (error) { }

  console.log("Build success");
}

run();