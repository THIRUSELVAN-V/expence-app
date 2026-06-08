import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://thiruselvan:thiru%40mongo@thiru.wsm7p8e.mongodb.net/expense_tracker?appName=thiru";
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};
