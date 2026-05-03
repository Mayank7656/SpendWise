const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    type: {
      type: String,
      enum: ["bank", "cash", "wallet", "card", "investment"],
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
      maxlength: 5
    }
  },
  { timestamps: true }
);

accountSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Account", accountSchema);
