const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollementEmail } = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const { response } = require("express");
const { sign } = require("jsonwebtoken");
require("dotenv").config();


exports.capturePayment = async(req, res)=> {
    
    const { courses } = req.body;
    const { userId } = req.user.id;

    if (courses === 0) {
        return res.json({success:false,message:"Please provide valide Course Id"})
    }

    let totalAmount = 0;

    for (const course_id of courses) {
        let course;
        try {
            course = await Course.findById(course_id);
            if (!course) {
                return res.json({success:false,message:"Could not find course"})

            }
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.json({
                    success: false,
                    message:"Student is already enrolled"
                })

            }
            totalAmount += course.price;
        } catch (error) {
            console.log(error);
            return res.json({
                success: false,
                message:error.message,
            })
        }
    }
    const options = {
        amount: totalAmount * 100,
        currrency: "INR",
        receipt:Math.random(Date.now()).toString()
    }
    try {
        const paymentResponse = await instance.orders.create(options);
        res.josn({
            success: true,
            message:paymentResponse,
        })
    } catch (error) {
        console.log(error);
            return res.json({
                success: false,
                message:"Could not initiate order",
            })
    }
}

// verify payment
exports.verifyPayment = async (req, res) => {
    try {
        const razorpay_order_id = req.body?.razorpay_order_id;
        const razorpay_payment_id = req.body?.razorpay_payment_id;
        const razorpay_signature = req.body?.razorpay_signature;
        const courses = req.body?.courses;
        const userId = req.user.id;

        if (!razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !courses ||
            !userId
        ) {
            return res.json({
                success: false,
                message:"Payment Failed"
            })
        }

        let body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest("hex");
        
        if (expectedSignature === razorpay_signature) {
            // enrolled karo student ko
            await enrolledStudent(courses, userId, res);
             return res.json({
                 success: true,
                 message:"Payment Verified"
             })
        }
    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            message:"Payment Failed",
        })
    }
}

const enrolledStudent = async (courses,userId,res) => {
    if (!courses || !userId) {
        return res.json({
            success: false,
            message:"Please provide data for Courses or userId"
        })
    }
    // find the course and enrolled the student in it
   try {
     for (const courseId of courses) {
         const enrolledCourse = await Course.findOneAndUpdate(
             { _id: courseId },
             { $push: { studentsEnrolled: userId } },
             {new:true}
         )
 
         if (!enrolledCourse) {
             return res.json({
                 success: false,
                 message:"Course not found"
             })
         }
 
         //find the student and add the course to their list of enrolledCourses
         const enrolledStudent = await User.findOneAndUpdate(userId,
             {
                 $push: {
                 courses:courseId
                 }
             },
             {new:true}
         )
 
         const emailResponse = await mailSender(
             enrolledStudent.email,
             `Successfully Enrolled into ${enrolledCourse.courseName}`,
             courseEnrollementEmail(enrolledCourse.courseName,`${enrolledStudent.firstName}`)
         )
         console.log("Email sent successfully",emailResponse.response)
     }
   } catch (error) {
     console.log(error)
        return res.json({
            success: false,
            message:"Payment Failed",
        })
   }
}

// // capture the payment and initiate the Razorpay order
// exports.capturePayment = async (req, res) => {
//     //get courseId and userId
//     const { courseId } = req.body;
//     const userId = req.user.id;

//     // validation 
//     // valide course ID
//     if (!courseId) {
//         return res.json({
//             success: false,
//             message: "Please provide valid course ID",
//         });
//     }
//     // valide course details 
//     let course;
//     try {
//         course = await Course.findById(courseId);
//         if (!course) {
//             return res.json({
//                 success: false,
//                 message: "Cloud not find course details",
//             });
//         }

//         // User already pay for the same course
//         const uid = new mongoose.Types.ObjectId(userId); // convert string to objectId
//         if (course.studentsEnrolled.includes(uid)) {
//             return res.status(200).json({
//                 success: true,
//                 message: "Student is already enrolled for the same course",
//             })
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         })

//     }
//     // order create
//     const amount = course.price;
//     const currency = "INR";

//     const options = {
//         amount: amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes: {
//             courseId: courseId,
//             userId,
//         }
//     }
//     try {
//         // Initiate the payment using razorpay
//         const paymanetResponse = await instance.orders.create(options);
//         console.log(paymanetResponse);
//         return res.status(200).json({
//             success: true,
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymanetResponse.id,
//             currency: paymanetResponse.currency,
//             amount: paymanetResponse.amount,
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Could not initiate order",
//         })
//     }


// }

// // verify Signature of Razorpay and seerver
// exports.verifySignature = async (req, res) => {
//     const webhookSecret = "12345678";
//     const signature = req.headers["x-razorpay-signature"];
//     // hash the secretKey
//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if (signature === digest) {
//         console.log("Payment is authorized")

//         const { courseId, userId } = req.body.payload.payment.entity.notes;
//         try {
//             // find the course and enroll the student in it
//             const enrolledCourse = await Course.findByIdAndUpdate(
//                 { _id: courseId },
//                 {
//                     $push: {
//                         studentsEnrolled: userId
//                     },
//                 },
//                 { new: true }
//             );

//             if (!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Course not found"
//                 })
//             }
//             console.log(enrolledCourse);

//             // find the student and add the course to their list enrolled courses me
//             const enrolledStudent = await User.findByIdAndUpdate(
//                 { _id: userId },
//                 {
//                     $push: {
//                         course: courseId
//                     }
//                 },
//                 { new: true },

//             )
//             console.log(enrolledStudent);

//             // mail send karo confirmation ka
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations fron Kalpesh",
//                 "Congratulations you are successfully enrolled in course",
//             )
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "Signature verified and course added"
//             })
//         } catch (error) {
//             return res.status(500).json({
//                 success: false,
//                 message: error.message
//             })
//         }
//     }
//     else {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid request",
//         })
//     }

// } 