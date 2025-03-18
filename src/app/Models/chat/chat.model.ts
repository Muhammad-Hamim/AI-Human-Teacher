import { Schema, model } from "mongoose";
import { TChat } from "./chat.interface";

const chatSchema = new Schema<TChat>(
  {
    userId: {
      // type: Schema.Types.ObjectId,
      type:String,
      ref: "User",
      // required: true,
    },
    user: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "new chat",
    },

    lastMessageAt: {
      type: Date,
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
chatSchema.pre("save", function (next) {
  this.isDeleted = false;
  next();
});

export const Chat = model<TChat>("Chat", chatSchema);
