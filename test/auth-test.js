const expect = require("chai").expect;
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

// authmethod
const authMiddleware = require("../middleware/auth");

describe("Auth middleware", function () {
  // test get authorization
  it("Should throw error if no authorization header present", function () {
    const req = {
      get: () => null,
    };

    const res = {};
    const next = () => {};

    // Panggil middleware
    authMiddleware(req, res, next);

    // Periksa apakah isAuth sudah di-set menjadi false
    expect(req.isAuth).to.be.false;
  });

  // Test split
  it("shoul throw error if the authorization token just one string", function () {
    const req = {
      get: () => "xyz",
    };

    const res = {};
    const next = () => {};

    const auth = authMiddleware.bind(req, res, next);

    expect(auth).to.throw();
  });

  it("should set isAuth to false if the token is invalid", () => {
    // Buat objek dummy untuk request
    const req = {
      get: () => "Bearer invalid_token",
    };
    const res = {};
    const next = () => {};

    // Panggil middleware
    authMiddleware(req, res, next);

    // Periksa apakah isAuth sudah di-set menjadi false
    expect(req.isAuth).to.be.false;
  });

  it("should auth return userId after decoding the token", () => {
    const req = {
      get: function () {
        return "Bearer sadjaklsdjkalsdj";
      },
    };

    const res = {};
    const next = () => {};

    sinon.stub(jwt, "verify");

    // mengubah method jwt.verify menjadi return userId: 'abc'
    jwt.verify.returns({ userId: "abc" });
    authMiddleware(req, res, next);

    expect(req).to.have.property("userId");
    jwt.verify.restore();
  });

  it("should set isAuth to true and set userId in request if the token is valid", () => {
    // Buat token menggunakan jwt.sign
    const token = jwt.sign({ userId: "123" }, "pilotkodekey");

    // Buat objek dummy untuk request
    const req = {
      get: () => `Bearer ${token}`,
    };
    const res = {};
    const next = () => {};

    // Panggil middleware
    authMiddleware(req, res, next);

    // Periksa apakah isAuth sudah di-set menjadi true dan userId sudah di-set di request
    expect(req.isAuth).to.be.true;
    expect(req.userId).to.equal("123");
  });
});
