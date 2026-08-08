import { sendMail } from "../../utils/mailer.js";
import {inngest} from "../client.js";
import {NonRetryableError} from "inngest";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { analyzeTicketWithAI } from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
    {id: "on-ticket-created", retries:2},
    {event: "ticket/created"},
    async({ event,step }) => {
        try{
            const {ticketId} = event.data;
            console.log(`Ticket created with ID: ${ticketId}`);

            // Fetch the ticket details from the database
            const ticket = await step.run("fetch-ticket", async () => {
                const ticketObject = await Ticket.findById(ticketId);
                if(!ticketObject){
                    throw new NonRetryableError(`Ticket with ID ${ticketId} not found`);
                }
                return ticketObject; 
            });

            // Update the ticket status to "In Progress"
            await step.run("update-ticket-status", async () => {
                // Update the ticket status to "In Progress"
                ticket.status = "TODO";
                await ticket.save();
            }); 

            // Analyze the ticket using AI to determine priority, helpful notes, and related skills
            const aiResponse = analyzeTicketWithAI(ticket);

            // Update the ticket with AI response and assign a moderator based on related skills
            const relatedSkills = await step.run("ai-processing", async () => {
                // Simulate AI processing and updating the ticket with AI response
                let skills = [];
                if(aiResponse){
                    await Ticket.findByIdAndUpdate(ticketId, {
                        priority: !["low","medium","high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
                        helpfulNotes: aiResponse.helpfulNotes,
                        status: "IN_PROGRESS",
                        relatedSkills: Array.isArray(aiResponse.relatedSkills) ? aiResponse.relatedSkills : []
                    });
                    skills = Array.isArray(aiResponse.relatedSkills) ? aiResponse.relatedSkills : [];
                }
                return skills;  
            });

            // Assign a moderator based on related skills and send an email notification
            const moderator = await step.run("assign-moderator", async () => {
                // Simulate fetching a moderator's email from a database or another service
                let user = await User.findOne({
                    role: "moderator",
                    skills: {
                        $elemMatch: {
                            $regex: relatedSkills.join("|"),
                            $options: "i"
                        }
                    }
                });
                if(!user){
                    user = await User.findOne({role: "admin"});
                }
                await Ticket.findByIdAndUpdate(ticketId, {assignedTo: user?._id || null});
                return user;
            });

            // Send an email notification to the assigned moderator
            await step.run("send-email-notification", async () => {
                // Simulate sending an email notification to the assigned moderator
                if(moderator && moderator.email){
                    const finalTicket = await Ticket.findById(ticketId);
                    const email = moderator.email;
                    const subject = `New Ticket Assigned: ${finalTicket.title}`;
                    const message = `Hello ${moderator.email},\n\nA new ticket has been assigned to you.\n\nTicket ID: ${finalTicket._id}\nTitle: ${finalTicket.title}\nDescription: ${finalTicket.description}\nPriority: ${finalTicket.priority}\n\nPlease review and take the necessary actions.\n\nBest regards,\nThe Ticketing System Team`;
                    await sendMail(email, subject, message);
                }
            });

            return { success: true, message: `Ticket ${ticketId} processed successfully.` };
        }
        catch(error){
            console.error("Error in onTicketCreated function:", error);
            return { success: false, message: "An error occurred while processing the ticket creation event." };
        }
    }
);