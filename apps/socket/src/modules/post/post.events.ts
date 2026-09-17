import { Server } from "socket.io";
import { Post } from "@repo/db/models/post.model.js";

export const initPostChangeStream = (io: Server) => {
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let stream: ReturnType<typeof Post.watch> | undefined;
  let resumeToken: any;
  const start = () => {
    if (stopped) return;
    const current = Post.watch([], resumeToken ? { resumeAfter: resumeToken } : {});
    stream = current;
    current.on("change", async (change: any) => {
      resumeToken = change._id;
      if (change.operationType !== "insert") return;
      try {
        const post = await Post.findById(change.fullDocument._id).populate("author", "fullName email studentId");
        if (post && !stopped) io.emit("new-post", post);
      } catch (error) { console.error("Post broadcast failed", error); }
    });
    current.on("error", (error: any) => {
      console.error("Post stream interrupted", error.message);
      if (error.code === 286 || error.code === 260) resumeToken = undefined;
      void current.close().catch(() => {});
      if (!stopped) retry = setTimeout(start, 5000);
    });
  };
  start();
  return async () => {
    stopped = true;
    clearTimeout(retry);
    await stream?.close();
  };
};
