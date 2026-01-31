// import jwt from "jsonwebtoken";


// const protect = async (req, res, next) => {
//   const token = req.headers.authorization;
//   if(!token) {
//     return res.status(401).json({ message: "Unauthorized"});
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     req.userId = decoded.userId;
//     next();
//   } catch (error) {
//     return res.status(401).json({message: 'Unauthorized'});
//   }
// }

// export default protect;


import jwt from "jsonwebtoken";

const protect = async (req, res, next) => {
  try {
    // 1. Header se token nikalna
    const authHeader = req.headers.authorization;

    // 2. Check karna ki header hai aur 'Bearer ' se shuru ho raha hai
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // 3. 'Bearer ' hata kar sirf actual token string lena
    const token = authHeader.split(" ")[1];

    // 4. Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. UserId set karna (Check karein aapne sign karte waqt kya key use ki thi)
    req.userId = decoded.id || decoded.userId; 

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export default protect;