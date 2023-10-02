import { Configuration, OpenAIApi } from "openai";
import { spawn } from 'child_process';
import { Console } from "console";

const pythonExecutable = 'venv/bin/python3';
const pythonProcess = spawn(pythonExecutable, ['backend/cmd_based.py'], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

function sendToPythonAndGetResponse(question) {
  return new Promise((resolve, reject) => {
    // Listen for the Python script's response
    pythonProcess.stdout.once('data', (data) => {
      resolve(data.toString().trim());
    });

    // Handle potential errors
    pythonProcess.stderr.once('data', (err) => {
      reject(new Error(err.toString().trim()));
    });

    // Send the question to the Python script
    pythonProcess.stdin.write(`${question}\n`);
  });
}

export default async function (req, res) {
  const question = req.body.question || '';
  if (question.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid question",
      }
    });
    return;
  }

  try {
    const result = await sendToPythonAndGetResponse(question);
    console.log(`Received from Python script: ${result}`);
    res.status(200).json({ result });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
}