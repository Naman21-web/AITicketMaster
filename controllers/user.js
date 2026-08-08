import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";

// User signup
export const signup = async (req, res) => {
    const { email, password, skills=[] } = req.body;
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, skills });
        await newUser.save();

        // Trigger the Inngest function for user signup
        await inngest.send({
            name: "user/signup",
            data: { email }
        });

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET);
        res.status(201).json({ token });
    }
    catch (error) {
        res.status(500).json({ message: "An error occurred while signing up." });
    }
};  


//User login
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password or user." });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.json({ token });
    }
    catch (error) {
        res.status(500).json({ message: "An error occurred while logging in." });
    }
};     

//logout
export const logout = async (req, res) => {
    // In a stateless JWT authentication system, logout is typically handled on the client side by deleting the token.
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.status(400).json({ message: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Here you can implement token blacklisting if needed, but for simplicity, we'll just respond with a success message.
        res.clearCookie("token");
        res.status(200).json({ message: "You have been logged out." });
    });
};

export const  updateUser = async (req,res) => {
    const { skills=[] , role, email } = req.body;
    try{
        if(req.user?.role !== 'admin'){
            return res.status(403).json({ message: "Forbidden: You do not have permission to update user." });
        }
        const user = await User.findOne({ email });
        if(!user){
            return res.status(401).json({ message: "User not found." });
        }
        if(skills.length > 0){
            user.skills = skills;
        }
        user.role = role;
        await user.save();
        res.json({ message: "User updated successfully." });
    }catch(error){
        res.status(500).json({ message: "An error occurred while updating user." });
    }
};

export const getUsers = async (req,res) => {
    try{
        if(req.user?.role !== 'admin'){
            return res.status(403).json({ message: "Forbidden: You do not have permission to view user." });
        }
        const users = await User.find({ }).select('-password'); // Exclude password field
        res.json(users);
    }
    catch(error){
        res.status(500).json({ message: "An error occurred while fetching user." });
    }
};            