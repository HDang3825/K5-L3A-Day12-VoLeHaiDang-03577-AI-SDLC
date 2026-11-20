import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
const modelName = process.env.MODEL_NAME || "anthropic/claude-sonnet-5.5";

if (!apiKey) {
  console.error("Error: OPENROUTER_API_KEY is not set in .env");
  process.exit(1);
}

const promptArg = process.argv.slice(2).join(" ");
const prompt = promptArg || "Hello, please confirm you are ready to assist with game development.";

async function callClaude() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/dao-den-long",
        "X-Title": "Dao Den Long AI SDLC"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "You are Claude acting as Lead Game Architect & Developer for 'Đảo Đèn Lồng' adhering strictly to Test Contract v1.0."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenRouter API error ${response.status}:`, errText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(data.choices?.[0]?.message?.content || "No content returned");
  } catch (err) {
    console.error("Network / Execution error:", err.message);
    process.exit(1);
  }
}

callClaude();
