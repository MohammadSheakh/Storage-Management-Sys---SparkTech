// for google oauth
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import UserModel from "../models/user";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback", // Replace with  callback route
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await UserModel.findOne({
          email: profile.emails[0].value,
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = new UserModel({
          userName: profile.displayName,
          email: profile.emails[0].value,
          password: null,
        });

        const savedUser = await newUser.save();
        done(null, savedUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Serialize and deserialize user (optional, required for persistent sessions)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
