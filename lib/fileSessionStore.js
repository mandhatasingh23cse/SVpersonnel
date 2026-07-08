const fs = require("fs/promises");
const path = require("path");

module.exports = (session) => {
  const Store = session.Store;

  class FileStore extends Store {
    constructor(options = {}) {
      super();
      this.dir = options.dir || path.join(__dirname, "../sessions");
      this.cache = new Map(); // In-memory cache for fast session retrieval
      
      const fsSync = require("fs");
      if (!fsSync.existsSync(this.dir)) {
        fsSync.mkdirSync(this.dir, { recursive: true });
      }

      // Run cleanup on startup and then every 12 hours
      this.cleanExpiredSessions();
      this.cleanupInterval = setInterval(() => this.cleanExpiredSessions(), 12 * 60 * 60 * 1000);
      
      // Prevent the timer from keeping the Node.js event loop active on exit
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }

    async cleanExpiredSessions() {
      try {
        const files = await fs.readdir(this.dir);
        const now = new Date();
        
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          const filePath = path.join(this.dir, file);
          const sid = path.basename(file, ".json");
          
          try {
            const data = await fs.readFile(filePath, "utf8");
            const sessionData = JSON.parse(data);
            
            if (sessionData.cookie && sessionData.cookie.expires) {
              const expiry = new Date(sessionData.cookie.expires);
              if (expiry < now) {
                await fs.unlink(filePath);
                this.cache.delete(sid);
              }
            }
          } catch (e) {
            // Malformed session or lock issue, remove file
            await fs.unlink(filePath).catch(() => {});
            this.cache.delete(sid);
          }
        }
      } catch (err) {
        console.error("Session cleanup failed:", err.message);
      }
    }

    async get(sid, callback) {
      const now = new Date();
      
      // Check in-memory cache first
      if (this.cache.has(sid)) {
        const cached = this.cache.get(sid);
        if (cached.cookie && cached.cookie.expires) {
          const expiry = new Date(cached.cookie.expires);
          if (expiry > now) {
            return callback(null, cached);
          }
        }
        // Expired in cache
        this.cache.delete(sid);
      }

      const filePath = path.join(this.dir, `${sid}.json`);
      try {
        const data = await fs.readFile(filePath, "utf8");
        const sessionData = JSON.parse(data);
        
        // Cache it
        this.cache.set(sid, sessionData);
        callback(null, sessionData);
      } catch (err) {
        if (err.code === "ENOENT") {
          callback(null, null);
        } else {
          callback(err);
        }
      }
    }

    async set(sid, sessionData, callback) {
      // Update in-memory cache
      this.cache.set(sid, sessionData);

      const filePath = path.join(this.dir, `${sid}.json`);
      try {
        await fs.writeFile(filePath, JSON.stringify(sessionData), "utf8");
        callback(null);
      } catch (err) {
        callback(err);
      }
    }

    async destroy(sid, callback) {
      // Remove from cache
      this.cache.delete(sid);

      const filePath = path.join(this.dir, `${sid}.json`);
      try {
        await fs.unlink(filePath);
        callback(null);
      } catch (err) {
        if (err.code === "ENOENT") {
          callback(null);
        } else {
          callback(err);
        }
      }
    }
  }

  return FileStore;
};
