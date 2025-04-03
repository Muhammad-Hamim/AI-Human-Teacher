import { Schema, model } from "mongoose";
import { TContent, TMessage, TUser } from "./message.interface";

const userSchema = new Schema<TUser>(
  {
    senderType: {
      type: String,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const contentSchema = new Schema<TContent>(
  {
    contentType: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new Schema<TMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user: {
      type: userSchema,
      required: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    message: {
      type: contentSchema,
      required: true,
    },
    isAIResponse: {
      type: Boolean,
      required: true,
      default: false,
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure isDeleted is set to false
messageSchema.pre("save", function (next) {
  this.isDeleted = false;
  next();
});

export const Message = model<TMessage>("Message", messageSchema);
