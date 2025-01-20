import multer from "multer";
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/")); // Save files to the "uploads" folder
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName =
      file.originalname
        .replace(fileExt, "")
        .toLowerCase()
        .split(" ")
        .join("-") +
      "-" +
      Date.now();
    cb(null, fileName + fileExt);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "application/pdf" || // PDF
      file.mimetype === "application/msword" || // DOC
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
    ) {
      cb(null, true);
    } else {
      //cb(null, false);
      cb(new Error("Only .jpg, .png or .jpeg format allowed !"), false); // sure na .. false may be lage na
    }
  },
});

export default upload;
