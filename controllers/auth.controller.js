import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";

export const signup = async (req, res) => {
  const { email, fullname, password } = req.body;

  try {
    if (!email || !fullname || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      fullname,
      password: hashedPassword,
      verificationToken: generateVerificationCode(),
      verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.verificationToken);

    // Generate JWT and set cookie
    generateTokenAndSetCookie(res, newUser._id);

    return res.status(201).json({
      success: true,
      message: "User created successfully. Please verify your email.",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullname: newUser.fullname,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpiresAt = null;
    await user.save();

    await sendWelcomeEmail(user.email, user.fullname);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ success: false, message: "Email not verified" });
    }

    // Generate JWT and set cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: `Internal server error\nError: ${error.message}`,
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Reset password token generation
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // Token valid for 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetExpiresAt;
    await user.save();

    await sendPasswordResetEmail(
      user.email,
      `https:front-end-link/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const authCallback = (req, res) => {
  generateTokenAndSetCookie(res, req.user._id);
  res.redirect("http://localhost:5173"); // Redirect to your frontend dashboard for now I'm using dummy URL
};

// Testing me
export const me = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Authenticated user fetched successfully",
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};