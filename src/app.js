import pg from "pg";
import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
dotenv.config();

const app = express();
// const port = process.env.PORT || 8080;
const port = 4000;
const { Pool } = pg;
const configDatabase = {
  connectionString: process.env.DATABASE_URL,
};
if (process.env.NODE_ENV === "production") configDatabase.ssl = true;
const pool = new Pool(configDatabase);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  secure: true,
  port: port,
});

const tables = ["comments", "follows", "likes", "posts", "users"];

pool.connect((err, client) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }

  tables.forEach(async (table) => {
    const res = await client.query(`LISTEN ${table}`);
    client.on("notification", (msg) => {
      if (msg.channel === table) {
        console.log(msg);
        // const data = JSON.parse(msg.payload);
        const data = msg.channel;
        io.emit("update", { table, data });
      }
    });
  });
});

app.use(express.static("public"));

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
