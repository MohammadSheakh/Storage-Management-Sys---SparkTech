import generateToken from "../utils/generateToken";
import UserModel from "../models/user";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import express from "express";
import generateCode from "../utils/generateVerificationCode";
import Folder from "../models/folder";
import File from "../models/file";
import passport from "../config/passportConfig";
import jwt from "jsonwebtoken";

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const login = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    // check user exist or not
    const user = await UserModel.findOne({ email });
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        _id: user._id,
        email: user.email,
        userName: user.userName,
        accessToken: generateToken(user._id),
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          message: "Invalid Email or Password",
          code: 401,
        },
      });
    }
  } catch (err) {}
};

const registration = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      res.status(400).json({ message: "Please fill all required fields" });
      return;
    }

    const userExists = await UserModel.findOne({ email: email.trim() });
    if (userExists) {
      res.status(400).json({ error: "user already exist" });
      return;
    }

    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, async function (err, hash) {
      if (err) {
        console.log(
          "error from userController -> bcrypt.hash() => if(err) => ",
          err
        );
      } else {
        const user = new UserModel({
          userName,
          email,
          password: hash,
        });

        await user.save();

        res.status(201).json({
          success: true,
          data: {
            _id: user._id,
            email: user.email,
            name: user.userName,
            accessToken: generateToken(user._id),
          },
          message: "User created successfully",
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: 500,
      },
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({ error: "Authentication failed" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.userName,
        accessToken: token,
      },
      message: "Google sign-in successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: 500,
      },
    });
  }
};

const getVerificationCode = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate a 6-digit verification code
    const verificationCode = generateCode();

    // Save the code and expiration time in the user record
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send the code via email
    // await sendVerificationEmail(email, verificationCode); // 🟢

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyVerificationCode = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if the code matches and is not expired
    if (
      user.verificationCode === code &&
      user.verificationCodeExpires &&
      user.verificationCodeExpires > new Date()
    ) {
      res.status(200).json({
        success: true,
        message: "Verification code is valid.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const sendVerificationEmail = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while changing the password",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await File.deleteMany({ user: userId });

    await Folder.deleteMany({ user: userId });

    await user.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while deleting the account",
    });
  }
};

export {
  googleAuth,
  login,
  registration,
  googleCallback,
  getVerificationCode,
  verifyVerificationCode,
  resetPassword,
  sendVerificationEmail,
  changePassword,
  deleteAccount,
};
