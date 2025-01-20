import mongoose from "mongoose";

const connectToMongoDB = async (MONGO_URL: string): Promise<void> => {
  try {
    mongoose.Promise = Promise;

    await mongoose.connect(MONGO_URL, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
    });

    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });

    mongoose.connection.on("error", (err: Error) => {
      console.error("Mongoose connection error: " + err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Disconnected from MongoDB");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectToMongoDB;
