//require('dotenv').config({path: './env'});
import mongoose, { connect, mongo } from 'mongoose';
import { DB_NAME } from './constants.js';
import connectDB from './db/index.js';
import { app } from './app.js';

import dotenv from 'dotenv';
dotenv.config({path: './env'});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
})