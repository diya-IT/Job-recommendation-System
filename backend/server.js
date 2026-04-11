const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Routes
const UserRouters = require("./routes/UserRouters");
const UserLogin = require("./routes/UserLogin");
const UserReset = require("./routes/Userreset");
const editUserRoutes = require("./routes/editUser");
const deleteUserRoutes = require("./routes/deleteUser");
const userRoutes = require("./routes/User"); 
const addskills=require("./routes/Skills");// GET by id
const fetchskills=require("./routes/fetchskills");
const ExperienceRoutes=require("./routes/Experience");
const companyRoutes = require("./routes/Company");
const jobRoutes = require("./routes/Jobs");
const recuritercompanyRoutes=require("./routes/RecuriterCompany");
const UserTab=require("./routes/UserTab");
const SkillMaster=require("./routes/SkillMaster");
const AdminTotalcompany=require("./routes/AdminTotalcompany");
const Recommendationengine=require("./routes/Recommendationengine");
const OverviewTab=require("./routes/OverviewTab");
const Adminfetch=require("./routes/Adminfetch");
const mongoose = require("mongoose");

dotenv.config();
connectDB();

const app = express();
// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/users", UserRouters);
app.use("/api/users", UserLogin);
app.use("/api/users", UserReset);
app.use("/api/users/edit", editUserRoutes);
app.use("/api/users", deleteUserRoutes);

// USER PROFILE ROUTE (NO COLLISION)
app.use("/api/user", userRoutes);
app.use("/api/skills", addskills); 
app.use("/api/fetchskills", fetchskills);

//the experience level route
app.use("/api/experience", ExperienceRoutes);


// Company and Job Routes
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);


// ================= TEST ROOT =================
//the recuriter comapny call fetch details 
app.use("/api/reccompanies", recuritercompanyRoutes);
//================== ADMIN USER MANAGEMENT =================

app.use("/api/admin/users", UserTab); //  ADMIN USER MANAGEMENT
app.use("/api/aprofile",UserTab);
app.use("/api/admin/edit", UserTab); // Admin edit user route
//================== SKILL MASTER MANAGEMENT =================
app.use("/api/skillmaster", SkillMaster);

//================== ADMIN TOTAL COMPANIES COUNT =================
app.use("/api/adcompany/count", AdminTotalcompany);
app.use("/api/adcompany", AdminTotalcompany); // New route for total companies count

// Admin edit user route

//recommended jobs route===================//
app.use("/api/recommended", Recommendationengine);


//================== OVERVIEW STATS =================
app.use("/api", OverviewTab);

//================== ADMIN PROFILE MANAGEMENT =================
app.use("/api/admin",Adminfetch);


app.get("/", (req, res) => res.send("API running"));
 
// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
