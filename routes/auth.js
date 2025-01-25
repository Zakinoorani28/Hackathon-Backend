const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("firebase-admin"); // Firebase Admin SDK
const router = express.Router();

// Initialize Firebase Admin SDK (Ensure your Firebase admin credentials are correctly configured)
const serviceAccount = require("../hackathon-28-firebase-adminsdk.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) return res.status(401).send("Unauthorized: No token provided");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token); // Verify Firebase token
        req.user = decodedToken; // Attach the decoded token to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        res.status(401).send("Unauthorized: Invalid Firebase token");
    }
};

// Route to save user to MongoDB
router.post("/saveUser", verifyFirebaseToken, async (req, res) => {
    try {
        // Extract data from request body (includes fullName now)
        const { email, uid, fullName } = req.body;

        // Check if the user already exists in MongoDB
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).send("User already exists in MongoDB");
        }

        // Save the new user to MongoDB
        const newUser = new User({
            email,
            firebaseUid: uid,
            name: fullName || "Anonymous", // Save fullName from frontend or default to "Anonymous"
        });
        await newUser.save();

        res.status(201).send("User saved to MongoDB successfully");
    } catch (err) {
        console.error("Error saving user to MongoDB:", err);
        res.status(500).send("Error saving user to MongoDB: " + err.message);
    }
});

module.exports = router;
