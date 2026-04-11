import mongoose from 'mongoose';

const anonymousPostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: [10, 'Post must be at least 10 characters'],
      maxlength: [500, 'Post cannot exceed 500 characters'],
      trim: true,
    },
    reactions: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isPersistent: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: false,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiration
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to add reaction
anonymousPostSchema.methods.addReaction = function (reactionType) {
  const currentCount = this.reactions.get(reactionType) || 0;
  this.reactions.set(reactionType, currentCount + 1);
  return this.save();
};

const AnonymousPost = mongoose.model('AnonymousPost', anonymousPostSchema);

export default AnonymousPost;

