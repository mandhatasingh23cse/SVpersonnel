const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { getClient } = require("./supabaseStore");

const DATA_FILE = path.join(__dirname, "../data/workMessages.json");

if (!fsSync.existsSync(DATA_FILE)) {
  if (!fsSync.existsSync(path.dirname(DATA_FILE))) {
    fsSync.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fsSync.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

async function getLocalMessages() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalMessages(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local work messages:", err.message);
  }
}

async function getMessagesForConversation(workId, peerId, clientId) {
  const all = await getAllWorkMessages();
  const wid = String(workId || "");
  const pid = String(peerId || "");
  const cid = String(clientId || "");

  return all.filter(m => 
    String(m.workId) === wid &&
    ((String(m.senderId) === pid && String(m.receiverId) === cid) ||
     (String(m.senderId) === cid && String(m.receiverId) === pid) ||
     String(m.senderId) === pid || String(m.receiverId) === pid)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function getAllWorkMessages() {
  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("work_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) {
        return data.map(m => ({
          id: m.id,
          workId: m.work_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          receiverId: m.receiver_id,
          text: m.text,
          createdAt: m.created_at
        }));
      }
    }
  } catch (e) {
    // Fallthrough to local
  }
  return await getLocalMessages();
}

async function sendWorkMessage({ workId, senderId, senderName, senderRole, receiverId, text }) {
  const newMsg = {
    id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    workId: String(workId || ""),
    senderId: String(senderId || ""),
    senderName: senderName || "User",
    senderRole: senderRole || "user",
    receiverId: String(receiverId || ""),
    text: text || "",
    createdAt: new Date().toISOString()
  };

  try {
    const client = getClient();
    if (client) {
      const { error } = await client
        .from("work_messages")
        .insert({
          id: newMsg.id,
          work_id: newMsg.workId,
          sender_id: newMsg.senderId,
          sender_name: newMsg.senderName,
          sender_role: newMsg.senderRole,
          receiver_id: newMsg.receiverId,
          text: newMsg.text,
          created_at: newMsg.createdAt
        });
      if (!error) {
        const local = await getLocalMessages();
        local.push(newMsg);
        await saveLocalMessages(local);
        return newMsg;
      }
    }
  } catch (e) {
    // Ignore error
  }

  const local = await getLocalMessages();
  local.push(newMsg);
  await saveLocalMessages(local);
  return newMsg;
}

module.exports = {
  getAllWorkMessages,
  getMessagesForConversation,
  sendWorkMessage
};
