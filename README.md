# AI Generator (Groq Cloud)

A production-ready Next.js app that provides:

- conversational Q&A (Groq Cloud API),
- seminar intent detection with structured seminar details,
- file upload analysis with estimated AI-usage percentage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env
```

Set:

- `GROQ_API_KEY`: your Groq Cloud API key (server-side only).
- `GROQ_MODEL`: model name (default: `llama-3.3-70b-versatile`).

## Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

Build/start for production:

```bash
npm run build
npm run start
```

## API Endpoints

- `POST /api/chat`
  - Input: `{ prompt, messages }`
  - Detects intent: `general_qa | seminar_details | document_analysis`
  - For `seminar_details`, returns structured fields with `unknown` when missing.

- `POST /api/analyze`
  - Multipart form-data with `file`
  - Supported types: TXT, PDF, DOCX (max 5MB)
  - Returns:
    - `estimated_ai_percentage`
    - `estimated_human_percentage`
    - `confidence`
    - `rationale`
    - `flagged_segments`

## Security and reliability

- Groq API key is used only on server endpoints.
- Input/file validation is enforced.
- Errors return safe, user-friendly messages.

## AI percentage limitations

The AI usage result is a heuristic estimate, not ground truth. It can produce false positives/negatives and should be used as an advisory signal only.
