import {Router} from 'express';
import { loginUser, logOutUser, refreshAccessToken, registerUser } from '../controllers/user.controller.js';
import { upload } from  '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)



//secured routes
router.route("/logout").post(verifyJWT,  logOutUser)
router.route("/refreah-token").post(refreshAccessToken)

export default router;