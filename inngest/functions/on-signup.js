import { sendMail } from "../../utils/mailer.js";
import {inngest} from "../client.js";

export const onUserSignup = inngest.createFunction(
    {id: "on-user-signup", retries:2},
    {event: "user/signup"},
    async({ event,step }) => {
        try{
            const {email } = event.data;
            console.log(`User signed up with email: ${email}`);
            // You can add additional logic here, such as sending a welcome email or logging the event to a database.
            const user = await step.run("get-user-email", async () => {
                // Simulate fetching user email from a database or another service
                const userObject = await User.findOne({email});
                if(!userObject){
                    throw new NonRetryableError(`User with email ${email} not found`);
                }
                return userObject;
            });
            await step.run("send-welcome-email", async () => {
                // Simulate sending a welcome email
                const email = user.email;
                const subject = "Welcome to the Ticketing System";
                const message = `Hello ${user.email},\n\nThank you for signing up for our ticketing system! We're excited to have you on board.\n\nBest regards,\nThe Ticketing System Team`;
                await sendMail(email, subject, message);
            });

            return { success: true, message: `Welcome email sent to ${email}` };
        }catch(error){
            console.error("Error in onUserSignup function:", error);
            return { success: false, message: "An error occurred while processing the signup event." };
        }
    }
);