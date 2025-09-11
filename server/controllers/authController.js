import { User } from '../models/userModel.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken };
}

export const signup = async (req, res) => {
    const { firstName, lastName, email, password, cnfpassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            if (password === cnfpassword) {
                const newUser = new User({ firstName, lastName, email, password });
                await newUser.save();
                return res.status(201).json({ message: "User registered successfully." })
            } else {
                return res.status(400).json({ error: "Password not matches." });
            }
        } else {
            return res.status(401).json({ error: "Email already exists" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error !" });
    }
}

// controller for login
export const login = async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "User not found !" });
        }

        const passwordMatch = await user.comparePassword(password);

        if (passwordMatch) {
           const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

            const loggedInUser = await User.findById(user._id).select("-password");

            const options = {
                httpOnly: true,
                secure: false, 
                sameSite: 'Lax'
            }

            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json({
                    message: 'Login Successful',
                    user: loggedInUser, accessToken, refreshToken
                });
        } else {
            return res.status(401).json({ message: "Password doesn't matches !" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error !" })
    }
}

export const getLoggedInUserDetails = async (req, res) => {
    return res.status(200).json({ currentUser: req.user });
}