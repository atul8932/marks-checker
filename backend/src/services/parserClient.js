const axios = require("axios");
const FormData = require("form-data");

async function parsePdf({ parserUrl, file, answerKeyFile, exam, expectedQuestions }) {
  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname || "response.pdf",
    contentType: file.mimetype || "application/pdf",
  });
  
  if (answerKeyFile) {
    form.append("answer_key_file", answerKeyFile.buffer, {
      filename: answerKeyFile.originalname || "answer_key.pdf",
      contentType: answerKeyFile.mimetype || "application/pdf",
    });
  }
  
  if (exam) {
    form.append("exam", exam);
  }
  
  if (expectedQuestions != null) {
    form.append("expected_questions", String(expectedQuestions));
  }

  const url = `${parserUrl.replace(/\/$/, "")}/parse`;
  const resp = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 60_000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: (s) => s >= 200 && s < 500,
  });

  if (resp.status >= 400) {
    const err = new Error(
      resp.data?.message || `Parser error (HTTP ${resp.status})`
    );
    err.statusCode = 502;
    err.code = "ParserError";
    throw err;
  }

  return resp.data;
}

module.exports = { parsePdf };

