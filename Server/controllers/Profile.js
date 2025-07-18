
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader")

exports.updateProfile = async (req, res) => {
    try {
        const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
        const id = req.user.id;
        if (!contactNumber || !gender || !id) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            });
        }
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.gender = gender;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;

        await profileDetails.save();
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profileDetails
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}
// explore --> How can we schedule this deleetion operation
// cronjob
// delete account
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id);
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        // delete profile 
        await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
        // delete user 
        await User.findByIdAndDelete({ _id: id });
        // enrolled user from all enrolled course
        return res.status(200).json({
            success: true,
            message: "user deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to  delete User",
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id).populate("additionalDetails").exec()
        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            userDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to  delete User",
            error: error.message,
        })
    }
}
exports.updateDisplayPicture = async (req, res) => {
    try {
        const userId = req.user.id // add this to inspect what Postman is sending

const displayPicture = req.files?.displayPicture;

if (!displayPicture) {
  return res.status(400).json({
    success: false,
    message: "No file uploaded",
  });
}
        const image = await uploadImageToCloudinary(displayPicture, process.env.FOLDER_NAME,1000,1000);

        console.log(image)
        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true }
        )
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}