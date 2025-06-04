import mongoose, { Document, Schema } from "mongoose";

// Interface for Lesson
interface ILesson {
  title: string;
  youtubeUrl: string;
  duration?: number ;
  resources?: Array<{
    name: string;
    url: string;
  }>;
  _id?: mongoose.Types.ObjectId;
}

interface IThumbnail {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

// Interface for Course
interface ICourse extends Document {
  title: string;
  description: string;
  artistId: mongoose.Types.ObjectId;
  price: number;
  thumbnail?: IThumbnail;
  isApproved: boolean;
  lessons: ILesson[];
  students: mongoose.Types.ObjectId[];
  status: "draft" | "published" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Lesson Schema
const lessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: true
  },
  youtubeUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    min: 1
  },
  resources: [{
    name: String,
    url: String
  }]
}, { _id: true });

// Course Schema
const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
 thumbnail: {
    type: {
      url: String,
      publicId: String,
      width: Number,
      height: Number
    },
    _id: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  lessons: [lessonSchema],
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  status: {
    type: String,
    enum: ["draft", "published", "rejected"],
    default: "draft"
  },
  rejectionReason: String
}, { timestamps: true });

courseSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ price: 1 });

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
export type { ICourse, ILesson, IThumbnail };