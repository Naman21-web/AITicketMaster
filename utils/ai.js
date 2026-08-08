import {createAgent, gemini} from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
    const supportAgent = createAgent({
        name: "AI Ticket Triage Assistant",
        model: gemini({
            model: "gemini-1.5",
            apiKey: process.env.GEMINI_API_KEY
        }),
        system:  `You aree an expert AI assistant that processes technical support tickets.

        Your job is to:
        1. Summarize the issue.
        2. Estimate its priority
        3. Provide helpful notes and resource links for human moderators.
        4. List relevant technical skills required.             
        
        IMPORTANT:
        - Respond with *only* valid raw JSON.
        - Do NOT include markdown, code fences, comments, or any extra formatting.
        - The format must be a raw JSON object.

        Repeat: Do not wrap your output in markdown or code fences.
        `
    });

    const response = await supportAgent.run(`
            You are a ticket triage agent. Only return a strict JSON object with no extra text, headers, or markdown.

            Analyze the following support ticket and provide a JSON object with:

            - summary: A short 1-2 sentence summary of the issue.
            -  priority: One of "low","medium", or "high.
            - helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful eternal links or resources if possible.
            - relatedSkills: An array of relevant skills required to solve the issue (e.g., ["JavaScript", "React", "Node.js"]).

            Respond ONLY in this JSON format and do not include any other text or markdown in the answer:

            {
            "summary": "Short summary of the ticket",
            priority: "low" | "medium" | "high",
            "helpfulNotes": "Detailed technical explanation and resources",
            "relatedSkills": ["Skill1", "Skill2", "Skill3"]
            }

            ---

            Ticket information:
            - Title: ${ticket.title}
            - Description: ${ticket.description}
            - Status: ${ticket.status}
        `);
    
    const raw = response.output[0].context;
    
    try{
        const match =raw.match(/```json\s*([\s\S]*?)\s*```/i);   
        const jsonString = match ? match[1] : raw.trim();
        return JSON.parse(jsonString);
    }
    catch(error){
        console.error("Error parsing JSON from AI response:", error);
        return null;
    }
};

export default analyzeTicket;