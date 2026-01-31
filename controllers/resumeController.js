import imagekit from "../config/imageKit.js";
import Resume from "../models/Resume.js";
import fs from 'fs';

// 1. Controller for creating a new resume (Manual)
// POST: /api/resumes/create
export const createResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { title } = req.body;

        const newResume = await Resume.create({ userId, title });

        return res.status(201).json({ 
            message: 'Resume created successfully', 
            resume: newResume 
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// 2. NEW: Controller for Uploading Resume via PDF Text (AI/Upload)
// POST: /api/resumes/upload-resume
export const uploadResumeAI = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, resumeText } = req.body;

        if (!resumeText) {
            return res.status(400).json({ message: "No text content received" });
        }

        // Hum resume create kar rahe hain aur saara text 'professional_summary' mein daal rahe hain
        // Taaki user use builder mein dekh sake aur edit kar sake
        const newResume = await Resume.create({
            userId,
            title: title || "Uploaded Resume",
            professional_summary: resumeText, // PDF ka extracted text yahan save hoga
            personal_info: {
                full_name: "New Profile", // Placeholder values
            }
        });

        return res.status(201).json({
            message: 'Resume uploaded successfully',
            resume: newResume
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// 3. Controller for deleting a resume
// DELETE: /api/resumes/delete/:resumeId
export const deleteResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId } = req.params;

        const deletedResume = await Resume.findOneAndDelete({ userId, _id: resumeId });

        if (!deletedResume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        return res.status(200).json({ message: 'Resume deleted successfully' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// 4. Get user resume by id
// GET: /api/resumes/get/:resumeId
export const getResumeById = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId } = req.params;

        const resume = await Resume.findOne({ userId, _id: resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        // Formatting response
        const resumeObj = resume.toObject();
        delete resumeObj.__v;
        delete resumeObj.createdAt;
        delete resumeObj.updatedAt;

        return res.status(200).json({ resume: resumeObj });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// 5. Get resume by id public
// GET: /api/resumes/public/:resumeId
export const getPublicResumeById = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const resume = await Resume.findOne({ public: true, _id: resumeId });

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found or not public' });
        }

        return res.status(200).json({ resume });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// 6. Controller for updating a resume
// PUT: /api/resumes/update
export const updateResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId, resumeData, removeBackground } = req.body;
        const image = req.file;

        let resumeDataCopy;
        if (typeof resumeData === 'string') {
            resumeDataCopy = JSON.parse(resumeData);
        } else {
            resumeDataCopy = structuredClone(resumeData);
        }

        // ImageKit Upload Logic
        if (image) {
            const imageBufferData = fs.createReadStream(image.path);
            const response = await imagekit.files.upload({
                file: imageBufferData,
                fileName: 'resume.png',
                folder: 'user-resumes',
                pre: 'w-300, h-300, fo-face,z-0.75' + (removeBackground ? ',e-bgremove' : '')
            });

            // Ensure nested object exists before assignment
            if (!resumeDataCopy.personal_info) resumeDataCopy.personal_info = {};
            resumeDataCopy.personal_info.image = response.url;
            
            // Cleanup local file
            fs.unlinkSync(image.path);
        }

        // IMPORTANT: findOneAndUpdate use karein with userId for security
        const resume = await Resume.findOneAndUpdate(
            { userId, _id: resumeId },
            resumeDataCopy,
            { new: true }
        );

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        return res.status(200).json({ message: 'Saved successfully', resume });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}