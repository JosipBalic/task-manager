// import needed functions from monogoose
const mongoose = require('mongoose');

// define new mongo db schema
const taskSchema = new mongoose.Schema(
  {
    // task description
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // task status
    completed: {
      type: Boolean,
      default: false,
    },
    // task owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    // define timestamps for task schema
    timestamps: true,
  },
);

// create task model based upon task schema
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
