#!/usr/bin/env node

import readline from 'readline';

const apiKey = process.env.RUNWALL_API_KEY;
const runwallUrl = process.env.RUNWALL_URL || "https://runwall.vercel.app/mcp";

if (!apiKey) {
  console.error("Error: RUNWALL_API_KEY environment variable is required.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  
  try {
    const response = await fetch(runwallUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: line
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error(`HTTP Error from Runwall: ${response.status} ${response.statusText} - ${errText}`);
      return;
    }
    
    const responseText = await response.text();
    process.stdout.write(responseText + '\n');
  } catch (err) {
    console.error(`Bridge network error: ${err.message}`);
  }
});

console.error(`Runwall Stdio-to-HTTP bridge active. Exposing ${runwallUrl}`);
