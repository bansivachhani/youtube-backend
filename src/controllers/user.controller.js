import bcrypt from "bcryptjs"; // Make sure to import bcrypt
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validatebeforesave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

//get user details from frontend
//validation - not empty
// check if user already exists: username or email
// check for images, check for avatar
// upload them to cloudinary
// create use object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
const registerUser = asyncHandler(async (req, res) => {
  let { fullname, email, username, password } = req.body;

  // Convert password to string explicitly
  password = String(password);

  // Detailed logs to check the data types and values
  console.log("email:", email, "Type of email:", typeof email);
  console.log("username:", username, "Type of username:", typeof username);
  console.log("fullname:", fullname, "Type of fullname:", typeof fullname);
  console.log("password:", password, "Type of password:", typeof password);

  // Check if any field is empty or not a string
  if (
    [fullname, email, username, password].some(
      (field) => typeof field !== "string" || field.trim() === ""
    )
  ) {
    console.log("Validation failed: One of the fields is empty or not a string");
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists (email or username)
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  console.log(req.files);
  // Avatar and cover image handling
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Create user in database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password, // Store hashed password
    username: username.toLowerCase(),
  });

  // Fetch created user excluding password and refreshToken
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, while registering user");
  }

  // Return successful response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});



const deleteTestUser = async () => {
  try {
    const result = await User.findOneAndDelete({ email: "bansi@gmail.com" });
    if (result) {
      console.log("✅ Test user deleted successfully.");
    } else {
      console.log("⚠️ No such user found.");
    }
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
  }
};

deleteTestUser();

const loginUser = asyncHandler(async (req, res) => {
  //red body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(incomingRefreshToken)
  {
    throw new ApiError(401, "Unauthorized Token") 
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  )

  const user = User.findById(decodedToken?._id)

  if(!user)
  {
    throw new ApiError(401, "Invalid Refresh Token") 
  }

  if(incomingRefreshToken !== user?.refreshToken)
  {
    throw new ApiError(401, "Refresh Token is expired or used ") 
  }

  const options = {
    httpOnly: true,
    secure: true
  }

  const {accessToken,refreshAccessToken} =await generateAccessAndRefreshToken(user._id)

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token refreshed successfully"))
})
export { registerUser, loginUser, logOutUser,refreshAccessToken };
