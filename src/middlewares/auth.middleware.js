import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
   
   try{
    const token =  req.cookies?.accessToken || req.header
    req.header("Authorization")?.replace("Bearer ", "").trim()

    
    if(!token)
    {
        throw new ApiError(401, "You are not authorized to access this resource")
    }

    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).
    select("-password -refreshToken")

    if(!user)
    {
        // NEXT_VIDEO : TODO discuss about frontend
        throw new ApiError(401,"Invalid Access Token")
    }

    req.user = user;
    next()

   }

   catch(error){
      return next(new ApiError(401, "Invalid or expired token"))
   }

})