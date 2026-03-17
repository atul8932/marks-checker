const { createApp } = require("./app");
const { connectMongo } = require("./config/db");
const { env } = require("./config/env");

async function start() {
  await connectMongo(env.mongoUri);

  const app = createApp({ parserUrl: env.parserUrl });

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

