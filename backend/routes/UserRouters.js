const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, companyName, companyTitle, companyWebsite } = req.body;

    // 🔹 Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    // 🔹 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔹 Validate role
    if (!["user", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'recruiter'" });
    }

    // 🔹 Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🔹 Create USER
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });
    await newUser.save();

    let responseUser = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    // 🔹 If RECRUITER, validate website & create Company
    if (role === "recruiter") {
      if (!companyName || !companyTitle || !companyWebsite) {
        return res.status(400).json({ message: "Company name, title, and website are required for recruiters" });
      }

      // ✅ FIXED: Check website connectivity + unique
      const websiteCheck = await checkWebsite(companyWebsite);
      if (!websiteCheck.isValid) {
        return res.status(400).json({ message: websiteCheck.message });
      }

      const company = new Company({
        companyName,
        companyTitle,
        companyWebsite,
        recruiterId: newUser._id,
        status: "verified"  // ✅ Now works with your schema
      });
      await company.save();

      responseUser.companyId = company._id;
    }

    res.status(201).json({
      user: responseUser,
      message: "User registered successfully",
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // ✅ Handle duplicate website error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Company with this website already exists" });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// ✅ FIXED: Proper timeout + single fetch attempt
async function checkWebsite(url) {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // ✅ Store timeout ID

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'JobPortal/1.0'
      }
    });

    clearTimeout(timeoutId); // ✅ Clear stored timeout

    return {
      isValid: response.status >= 200 && response.status < 400,
      message: response.status >= 200 && response.status < 400 ? 
        "Website verified successfully" : 
        "Website not reachable"
    };

  } catch (error) {
    console.log('Website check failed:', url, error.message);
    return {
      isValid: false,
      message: "Company website is not reachable. Please check the URL."
    };
  }
}

module.exports = router;
