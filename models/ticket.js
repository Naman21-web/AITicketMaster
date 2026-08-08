import mongoose from "mongoose";

const ticketSchema =new mongoose.Schema({
    title: String,
    description: String,
    status: {
        type: String,
        default: 'TODO',
        enum: ['TODO', 'in progress', 'closed']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    priority: String,
    deadline: Date,
    helpfulNotes: String,
    relatedSkills: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Ticket", ticketSchema);