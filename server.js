/* eslint-disable prefer-destructuring */
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const Chat = require("./models/chatModel");
const User = require("./models/userModel");
const Message = require("./models/messageModel");
const { logger } = require("./utils/logger");
const { connectDB } = require("./db");

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});

const connectedUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    User.findById(decoded.id).then((user) => {
      if (!user) {
        return next(new Error("Authentication error"));
      }
      user.password = undefined;
      user.__v = undefined;

      socket.user = user;

      if (connectedUsers.has(user._id.toString())) {
        connectedUsers.get(user._id.toString()).disconnect();
      }

      connectedUsers.set(user._id.toString(), socket);

      next();
    });
  } catch (error) {
    console.log(error.message);
    return next(new Error(error.message || "Authentication error"));
  }
});

io.on("connection", async (socket) => {
  console.log("⚡ User connected ->", socket.user.username);

  // disconnect event
  socket.on("disconnect", async () => {
    const user = await User.findById(socket.user._id);
    user.status = "offline";
    await user.save();
    socket.broadcast.emit("offline", socket.user._id);
    connectedUsers.delete(socket.user._id.toString());
    console.log("⚡ User disconnected ->", socket.user.username);
  });

  // change the status of the user to online
  socket.on("online", async () => {
    const user = await User.findById(socket.user._id);
    user.status = "online";
    await user.save();
    socket.broadcast.emit("online", socket.user._id);
    console.log("User is online");
  });

  // get all Users
  socket.on("getUsers", async (callback) => {
    try {
      let users = await User.find().select("username email _id status avatar");
      users = users.filter(
        (user) => user._id.toString() !== socket.user._id.toString(),
      );
      callback(users);
    } catch (error) {
      logger.error(error);
      console.log(error);
    }
  });

  // create a new chat
  socket.on("createChat", async (data, callback) => {
    try {
      const { userId } = data;
      // check if chat already exists
      const chatExists = await Chat.findOne({
        users: { $all: [socket.user._id.toString(), userId] },
      });
      if (chatExists) {
        return callback(chatExists);
      }

      const chat = await Chat.create({
        users: [socket.user._id.toString(), userId],
      });
      callback(chat);
    } catch (error) {
      logger.error(error);
      console.log(error.message);
    }
  });

  socket.on("createGroupChat", async (data, callback) => {
    try {
      const { userIds, groupImage, groupName } = data;
      const chat = await Chat.create({
        isGroupChat: true,
        users: userIds,
        groupName,
        groupImage,
        groupAdmins: [socket.user._id],
      });
      callback(chat);
    } catch (error) {
      logger.error(error);
      console.log(error);
    }
  });

  // get all chats
  socket.on("getChats", async (callback) => {
    try {
      const chats = await Chat.find({ users: socket.user._id });
      callback(chats);
    } catch (error) {
      logger.error(error);
      console.log(error);
    }
  });

  // get current chat
  socket.on("getCurrentChat", async (data, callback) => {
    const { chatId } = data;
    const chat = await Chat.findById(chatId);
    callback(chat);
  });

  // get all messages of a chat
  socket.on("getMessages", async (data, callback) => {
    const { chatId } = data;
    const messages = await Message.find({ chatId });
    callback(messages);
  });

  // send a message
  socket.on("sendMessage", async (data) => {
    const { chatId, message } = data;
    let newMessage;
    let lastMessage;
    if (message.imageUrl) {
      newMessage = await Message.create({
        chatId,
        imageUrl: message.imageUrl,
        sender: socket.user._id,
        readBy: [socket.user._id],
      });

      lastMessage = "Image";
    } else if (message.videoUrl) {
      newMessage = await Message.create({
        chatId,
        videoUrl: message.videoUrl,
        sender: socket.user._id,
        readBy: [socket.user._id],
      });
      lastMessage = "Video";
    } else {
      newMessage = await Message.create({
        chatId,
        message,
        sender: socket.user._id,
        readBy: [socket.user._id],
      });
      lastMessage = message;
    }

    const chat = await Chat.findById(chatId);
    chat.lastMessage = lastMessage;
    chat.lastMessageTime = newMessage.timestamp;
    await chat.save();

    newMessage = await newMessage.populate("chatId");
    io.emit("new", newMessage);
    io.emit("newSide", newMessage);
  });

  // mark all messages as read
  socket.on("markAsRead", async (data) => {
    const { chatId } = data;
    await Message.updateMany(
      { chatId, readBy: { $ne: socket.user._id } },
      { $push: { readBy: socket.user._id } },
    );
    io.emit("read", { chatId, userId: socket.user._id });
  });

  // get unread message count of a particular chat
  socket.on("getUnreadMessagesCount", async (data, callback) => {
    const { chatId } = data;
    const unreadMessagesCount = await Message.countDocuments({
      chatId,
      readBy: { $ne: socket.user._id },
    });
    callback(unreadMessagesCount);
  });

  //get lastest Message of a chat
  socket.on("getLastMessage", async (data, callback) => {
    const { chatId } = data;
    const lastMessage = await Message.findOne({ chatId })
      .sort({
        timestamp: -1,
      })
      .populate("sender", "username avatar")
      .populate("chatId", "isGroupChat");
    callback(lastMessage);
  });

  // delete a message
  socket.on("deleteMessage", async (data) => {
    const { messageId } = data;
    await Message.findByIdAndDelete(messageId);
    io.emit("messageDeleted", messageId);
  });

  // typing event
  socket.on("typing", (data) => {
    const { chatId, isTyping } = data;
    io.emit("typing", { chatId, isTyping, userId: socket.user._id });
  });

  socket.on("end", async () => {
    const user = await User.findById(socket.user._id);
    user.status = "offline";
    await user.save();

    // broadcast that the user is offline
    socket.broadcast.emit("offline", socket.user._id);

    console.log("User is offline");
    socket.disconnect(0);
  });

  socket.on("error", (error) => {
    logger.error(error);
    console.log(error);
    socket.disconnect(0);
  });
});
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT} 🚀`);
});
// Database connection AND PORT

connectDB()
  .then(() => {
    // Start server
    // app.listen(PORT, () => {
    //   console.log(`Server running on port ${PORT}`);
    //   logger.info("Logging Started 🚀");
    // });
  })
  .catch((error) => {
    console.error(error);
  });
