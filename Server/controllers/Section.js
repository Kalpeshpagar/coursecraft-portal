const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }
        const newSection = await Section.create({ sectionName });
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId ,
            {
                $push: {
                    courseContent: newSection._id,
                },
            },
            { new: true },
        );
    
        return res.status(200).json({
            success: true,
            message: "Section created Successfully",
            data:updatedCourseDetails,
        }
        )
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create section",
            data:updatedCourseDetails,
        })
    }
}

exports.updateSection = async (req, res) => {
try {
        // sectionId fetch sectionName
        const { sectionId, sectionName } = req.body;
        // validation
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message:"All Fields Are required",
            })
        }
        // updatesectionName
        const updateSection = await Section.findByIdAndUpdate(
            sectionId,
            { sectionName },
            {new:true},
        )
        return res.status(200).json({
            success: true,
            message:"Section Updated Successfully",
        })
} catch (error) {
    return res.status(500).json({
            success: false,
            message: "Unable to update section",
            data:updatedCourseDetails,
        })
}
}
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    // Step 1: Delete the section document
    await Section.findByIdAndDelete(sectionId);

    // Step 2: Remove the sectionId from the courseContent array in Course schema
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { courseContent: sectionId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Section deleted and reference removed from course",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete section",
      error: error.message,
    });
  }
};