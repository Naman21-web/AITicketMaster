import {inngest} from "../inngest/client.js";
import Ticket from "../models/ticket.js";

// Create a new ticket
export const createTicket = async (req, res) => {
    const { title, description } = req.body;
    if(!title || !description){
        return res.status(400).json({ message: "Title and description are required." });
    }
    try {
        const newTicket = new Ticket({ title, description, createdBy: req.user._id.toString() });
        await newTicket.save();

        // Trigger the Inngest function for ticket creation
        await inngest.send({
            name: "ticket/created",
            data: { 
                ticketId: (await newTicket)._id.toString(),
                title: newTicket.title,
                description: newTicket.description,
                createdBy: newTicket.createdBy.toString() 
            }
        });

        res.status(201).json({
            message: "Ticket created successfully.",
            ticket: newTicket
        });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ message: "An error occurred while creating the ticket." });
    }
};

export const getTickets = async (req,res) => {
    try{
        const user = req.user;
        let tickets = [];
        if(user.role !== "user"){
            tickets = await Ticket.find({})
            .populate("assignedTo",["email","_id"])
            .sort({createdAt:-1});
        }else{
            tickets = await Ticket.find({createdBy:user._id})
            .select("title description status createdAt")
            .sort({createdAt:-1});
        }
        return res.status(200).json({tickets});
    }
    catch(error){
        console.error("Error fetching tickets:", error);
        return res.status(500).json({ message: "An error occurred while fetching tickets." });
    }
};

export const getTicket = async (req,res) => {
    try{
        const user = req.user;
        let ticket;
        if(user.role !== "user"){
            ticket = await Ticket.findById(req.params.id)
            .populate("assignedTo",["email","_id"]);
        }else{
            ticket = await Ticket.findByOne({
                createdBy:user._id,
                _id:req.params.id
            })
            .select("title description status createdAt");
        }
        if(!ticket){
            return res.status(404).json({ message: "Ticket not found." });
        }
        return res.status(200).json({ticket});
    }
    catch(error){
        console.error("Error fetching ticket:", error);
        return res.status(500).json({ message: "An error occurred while fetching the ticket." });
    }
};