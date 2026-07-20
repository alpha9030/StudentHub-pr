const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { rateLimit } = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const XLSX = require('xlsx');

// Load environment variables
const envConfig = dotenv.config();
// Explicitly override PORT if defined in chatbot/.env to prevent inheriting parent process PORT (which causes EADDRINUSE on Render)
if (envConfig.parsed && envConfig.parsed.PORT) {
  process.env.PORT = envConfig.parsed.PORT;
}

const app = express();
const PORT = process.env.PORT || 3008;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure upload folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'upload_' + Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Setup logging (compact logs for production, detailed for development)
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Custom Request and Response logger middleware for Render deployment troubleshooting
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[INCOMING REQUEST] IP: ${clientIp} | Method: ${req.method} | Path: ${req.path}`);
  res.on('finish', () => {
    console.log(`[RESPONSE STATUS] Path: ${req.path} | Status: ${res.statusCode}`);
  });
  next();
});

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for local deployment flexibility
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Secure input validation helper
function validateMessages(messages) {
  if (!Array.isArray(messages)) return false;
  for (const msg of messages) {
    if (typeof msg !== 'object' || msg === null) return false;
    if (msg.role !== 'user' && msg.role !== 'model') return false;
    if (!Array.isArray(msg.parts)) return false;
    for (const part of msg.parts) {
      if (typeof part !== 'object' || part === null) return false;
      if (part.text === undefined && part.inlineData === undefined) return false;
      if (part.text !== undefined && typeof part.text !== 'string') return false;
      if (part.inlineData !== undefined) {
        if (typeof part.inlineData !== 'object' || part.inlineData === null) return false;
        if (typeof part.inlineData.mimeType !== 'string' || typeof part.inlineData.data !== 'string') return false;
      }
    }
  }
  return true;
}

// Sanitization utility (escape HTML special characters for generic text safety)
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // default 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 60, // limit each IP to 60 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after some time.',
    status: 429
  }
});

// Apply rate limiter to API routes only
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const customApiKey = req.headers['x-api-key'];
  const hasApiKey = !!(customApiKey || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'));
  res.status(200).json({
    status: 'ok',
    ai: hasApiKey ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    geminiConfigured: hasApiKey
  });
});

// Helper for exponential backoff retry logic on transient errors
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    // 503 Service Unavailable, 429 Rate limit, and transient network errors can be retried
    const status = error.status || (error.response && error.response.status);
    const isTransient = status === 503 || status === 429 || (error.message && (error.message.includes('fetch failed') || error.message.includes('network')));
    
    if (retries > 0 && isTransient) {
      console.warn(`Transient error encountered (Status: ${status || 'unknown'}). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// REST API for chat communication
app.post('/api/chat', async (req, res) => {
  const { messages, stream, customApiKey } = req.body;
  const headerApiKey = req.headers['x-api-key'];
  const apiKey = customApiKey || headerApiKey || process.env.GEMINI_API_KEY;

  const keyType = customApiKey ? 'Body Custom' : (headerApiKey ? 'Header Custom' : 'Default');
  const keyPrefix = apiKey ? apiKey.substring(0, 7) + '...' : 'None';
  console.log(`[BACKEND LOG] /api/chat: Using key type: ${keyType} | Prefix: ${keyPrefix}`);

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[BACKEND LOG] /api/chat: Request blocked because GEMINI_API_KEY is not configured.');
    return res.status(401).json({
      error: 'Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file or save your custom key in Settings.',
      status: 401
    });
  }

  // Validate request payload
  if (!messages || !validateMessages(messages)) {
    console.warn('[BACKEND LOG] /api/chat: Request blocked due to invalid message format.');
    return res.status(400).json({
      error: 'Invalid request format. "messages" must be an array of objects matching Gemini chat schema.',
      status: 400
    });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const lastMsgSnippet = messages.length > 0 && messages[messages.length - 1].parts && messages[messages.length - 1].parts[0] 
    ? messages[messages.length - 1].parts[0].text.substring(0, 100) 
    : 'None';
  console.log(`[BACKEND LOG] [Request] IP: ${clientIp} | Stream: ${!!stream} | Messages Count: ${messages.length}`);
  console.log(`[BACKEND LOG] [Last Prompt]: "${lastMsgSnippet}"`);

  // Set up model options
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash as the default model for general purpose chats
  const modelName = 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });

  // Prepare standard gemini formatting
  // The SDK expects: [{ role: 'user'|'model', parts: [{ text: '...' } | { inlineData: { mimeType, data } }] }]
  const formattedContents = messages.map(msg => {
    let cleanRole = (msg.role === 'assistant' || msg.role === 'ai') ? 'model' : (msg.role || 'user');
    if (cleanRole !== 'user' && cleanRole !== 'model') cleanRole = 'user';

    const rawParts = Array.isArray(msg.parts) ? msg.parts : [{ text: msg.text || ' ' }];
    const cleanParts = rawParts.map(p => {
      if (typeof p === 'string') return { text: p };
      if (p.inlineData) {
        return {
          inlineData: {
            mimeType: p.inlineData.mimeType,
            data: p.inlineData.data
          }
        };
      }
      return { text: p.text || ' ' };
    });

    return {
      role: cleanRole,
      parts: cleanParts.length > 0 ? cleanParts : [{ text: ' ' }]
    };
  });

  try {
    if (stream) {
      // Set headers for Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Prevent buffering in Nginx/proxies
      });

      console.log(`[BACKEND LOG] [Response Stream Start] Initiated Gemini stream for model: ${modelName}`);
      const resultStream = await retryWithBackoff(() => model.generateContentStream({ contents: formattedContents }));

      let responseChunkCount = 0;
      let totalLength = 0;

      try {
        for await (const chunk of resultStream.stream) {
          const text = chunk.text();
          if (text) {
            responseChunkCount++;
            totalLength += text.length;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        console.log(`[BACKEND LOG] [Response Stream Done] Sent ${responseChunkCount} chunks, Total Length: ${totalLength} chars.`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('[BACKEND LOG] [Response Stream Error] Error during content streaming:', streamError);
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted due to an internal server error.' })}\n\n`);
        res.end();
      }
    } else {
      console.log(`[BACKEND LOG] [Response Start] Initiated Gemini content generation for model: ${modelName}`);
      // Regular JSON response
      const response = await retryWithBackoff(() => model.generateContent({ contents: formattedContents }));
      const resultText = response.response.text();
      
      console.log(`[BACKEND LOG] [Response Done] Generated: "${resultText.substring(0, 100)}..." (${resultText.length} chars)`);
      
      res.status(200).json({
        text: resultText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[BACKEND LOG] [Response Error] Gemini API Error Stack:', error.stack || error);
    
    // Map specific Gemini API errors to friendly user-facing messages
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred while communicating with the AI service. Please try again.';

    const status = error.status || (error.response && error.response.status);
    const msg = error.message ? error.message.toLowerCase() : '';

    if (status === 400 || msg.includes('api_key_invalid') || msg.includes('api key') || msg.includes('unauthorized')) {
      statusCode = 401;
      errorMessage = 'Invalid Gemini API key. Please check your credentials and try again.';
    } else if (status === 403 || msg.includes('forbidden') || msg.includes('permission')) {
      statusCode = 403;
      errorMessage = 'Access denied. The API request was rejected. Please contact the administrator.';
    } else if (status === 404 || msg.includes('not found') || msg.includes('model not found')) {
      statusCode = 404;
      errorMessage = 'The requested AI model could not be found. It may be temporarily unavailable.';
    } else if (status === 429 || msg.includes('quota') || msg.includes('too many requests')) {
      statusCode = 429;
      errorMessage = 'AI service quota exceeded. You have made too many requests in a short time. Please wait a minute and try again.';
    } else if (status === 503 || msg.includes('overloaded') || msg.includes('unavailable')) {
      statusCode = 503;
      errorMessage = 'The AI service is currently overloaded or temporarily unavailable. We are retrying, but please try again shortly if this persists.';
    }

    if (stream) {
      res.write(`data: ${JSON.stringify({ error: errorMessage, status: statusCode })}\n\n`);
      res.end();
    } else {
      res.status(statusCode).json({
        error: errorMessage,
        status: statusCode,
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// PPTX slide text extraction helper
function parsePptxText(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    let text = '';
    
    // Sort slide XML files in natural numerical order
    const slideEntries = zipEntries
      .filter(entry => entry.entryName.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/\d+/)[0]);
        const numB = parseInt(b.entryName.match(/\d+/)[0]);
        return numA - numB;
      });
      
    slideEntries.forEach((entry, index) => {
      const content = entry.getData().toString('utf8');
      // Find all elements between <a:t>...</a:t>
      const textMatches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
      const slideText = textMatches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
      text += `[Slide ${index + 1}]:\n${slideText}\n\n`;
    });
    
    return text.trim();
  } catch (err) {
    throw new Error(`PPTX slide text extraction failed: ${err.message}`);
  }
}

// Excel sheet parser helper
function parseExcelText(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      text += `[Sheet: ${sheetName}]:\n${csv}\n\n`;
    });
    
    return text.trim();
  } catch (err) {
    throw new Error(`Excel spreadsheet parsing failed: ${err.message}`);
  }
}

// REST API for file uploads and server-side parsing
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.', status: 400 });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const mimeType = req.file.mimetype;
  const fileSize = req.file.size;
  const ext = fileName.split('.').pop().toLowerCase();

  console.log(`[BACKEND LOG] [File Received] Name: ${fileName} | Type: ${mimeType} | Size: ${fileSize} bytes`);

  let extractedContent = '';
  const isImage = mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext);

  try {
    if (isImage) {
      // For images, read file as base64 Data URL so the frontend can display thumbnails
      const data = fs.readFileSync(filePath);
      const base64 = data.toString('base64');
      extractedContent = `data:${mimeType || 'image/' + ext};base64,${base64}`;
      console.log(`[BACKEND LOG] [Image Converted] Name: ${fileName} | Size: ${base64.length} base64 chars`);
    } else {
      // For text files and documents, extract textual context
      if (ext === 'txt' || ext === 'md') {
        extractedContent = fs.readFileSync(filePath, 'utf8');
      } else if (ext === 'csv') {
        extractedContent = parseExcelText(filePath);
      } else if (ext === 'pdf') {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        extractedContent = pdfData.text;
      } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedContent = result.value;
      } else if (ext === 'xlsx') {
        extractedContent = parseExcelText(filePath);
      } else if (ext === 'pptx') {
        extractedContent = parsePptxText(filePath);
      } else {
        throw new Error('Unsupported file extension.');
      }
      
      console.log(`[BACKEND LOG] [Document Text Extracted] Name: ${fileName} | Extracted Text Length: ${extractedContent.length} chars`);
    }

    res.status(200).json({
      success: true,
      name: fileName,
      size: fileSize,
      type: mimeType || (isImage ? 'image/' + ext : 'text/plain'),
      data: extractedContent,
      isImage: isImage
    });

  } catch (err) {
    console.error(`[BACKEND LOG] [Extraction Error] Failed to extract from ${fileName}:`, err);
    res.status(500).json({
      error: `Failed to extract contents from "${fileName}": ${err.message}`,
      status: 500
    });
  } finally {
    // Delete temporary file from disk immediately to save space
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[BACKEND LOG] [File Cleanup] Temp file deleted: ${filePath}`);
      } catch (cleanupErr) {
        console.error(`[BACKEND LOG] [Cleanup Error] Failed to delete temp file ${filePath}:`, cleanupErr);
      }
    }
  }
});

// Fallback to index.html for spa support
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Gemini Chat Assistant Server is running!`);
  console.log(` Environment: ${NODE_ENV}`);
  console.log(` Port:        http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});
