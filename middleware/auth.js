const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // mengambil authorization dari http yang dikirim dalam request user
  const authHeader = req.get("Authorization");
  let token;
  if (!authHeader) {
    req.isAuth = false;
    next();
  } else {
    // ambil token dan ambil kuncinya saja
    token = authHeader.split(" ")[1];
  }

  let decodedToken;

  try {
    // validasi apakah token benar dengan dibandingkan dengan secret key yang kita miliki
    // lihat website jwt untuk melihat strukture code jwt
    decodedToken = jwt.verify(token, "pilotkodekey");
  } catch (err) {
    req.isAuth = false;
    next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    next();
  } else {
    // save userId in request
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
  }
};
