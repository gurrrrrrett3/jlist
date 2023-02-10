import express from "express";
import path from "path";
import fs from "fs";
import { List, Item } from "./types";
import config from "./config.json";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.sendFile(path.resolve("client/index.html"));
});

app.get("/admin", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  res.sendFile(path.resolve("client/admin.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.resolve("client/style.css"));
});

app.post("/api/keys", (req, res) => {
  const keys = req.body.keys as string[];
  const code = keys.splice(keys.length - config.passcode.length, config.passcode.length).join("");

  if (code !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  console.log(code);

  res.cookie("x-auth-token", config.passcode, { maxAge: 900000, httpOnly: true });
  res.send("/admin");
});

app.get("/api/lists", (req, res) => {
  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];
  res.json(lists);
});

app.get("/api/lists/:id", (req, res) => {
    const id = req.params.id;

    const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

    const list = lists.find((list) => list.path === id);

    if (!list) {
        res.status(404).send("List not found");
        return;
    }

    res.json(list);
});

app.post("/api/lists", (req, res) => {
  const name = req.body.name as string;
  const path = req.body.path as string;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  if (lists.find((list) => list.path === path)) {
    res.status(409).send("List already exists");
    return;
  }

  lists.push({
    name,
    path,
    items: [],
  });

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(req.body);
});

app.post("/api/lists/:id/items", (req, res) => {
  const name = req.body.name as string;
  const strikethrough = req.body.strikethrough as boolean;

  const id = req.params.id;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  list.items.push({
    name,
    addDate: new Date(),
    strikethrough,
    reason: "",
  });

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(req.body);
});

app.post("/api/lists/:id/items/:itemId/strike", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  const id = req.params.id;
  const itemId = req.params.itemId;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  const item = list.items.at(+itemId);

  if (!item) {
    res.status(404).send("Item not found");
    return;
  }

  item.strikethrough = !item.strikethrough;

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(item);
});

app.post("/api/lists/:id/items/:itemId/reason", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  const id = req.params.id;
  const itemId = req.params.itemId;

  const reason = req.body.reason as string;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  const item = list.items.at(+itemId);

  if (!item) {
    res.status(404).send("Item not found");
    return;
  }

  item.reason = reason;

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(item);
});

app.delete("/api/lists/:id/items/:itemId", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  const id = req.params.id;
  const itemId = req.params.itemId;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  const item = list.items.at(+itemId);

  if (!item) {
    res.status(404).send("Item not found");
    return;
  }

  list.items.splice(+itemId, 1);

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(item);
});

app.delete("/api/lists/:id", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  const id = req.params.id;

  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  lists.splice(lists.indexOf(list), 1);

  fs.writeFileSync("lists.json", JSON.stringify(lists, null, 4));

  res.json(list);
});

app.get("/admin/:id", (req, res) => {
  if (req.cookies["x-auth-token"] !== config.passcode) {
    res.status(401).send("Invalid passcode");
    return;
  }

  const id = req.params.id;

  const html = fs.readFileSync("client/admin.html", "utf8");
  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  res.send(
    html
      .replace('const listData = JSON.parse("{}")', `const listData = JSON.parse('${JSON.stringify(list)}')`)
      .replace("<h1>The List</h1>", `<h1 onclick="window.location.pathname = '/'">${list.name}</h1>`)
  );
});

app.get("/:id", (req, res) => {
  const id = req.params.id;

  const html = fs.readFileSync("client/index.html", "utf8");
  const lists = JSON.parse(fs.readFileSync("lists.json", "utf8")) as List[];

  const list = lists.find((list) => list.path === id);

  if (!list) {
    res.status(404).send("List not found");
    return;
  }

  res.send(
    html
      .replace('const listData = JSON.parse("{}")', `const listData = JSON.parse('${JSON.stringify(list)}')`)
      .replace("<h1>The List</h1>", `<h1 onclick="window.location.pathname = '/'">${list.name}</h1>`)
  );
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
