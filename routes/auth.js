const express = require('express');

const router = express.Router();

const User = require("../models/user");

const authController = require("../controllers/auth");

const isAuth = require("../middleware/is-auth");


const { body } = require('express-validator');


router.put('/signup', [
    body('email')
    .isEmail()
    .withMessage('Enter valid email')
    .custom((value, { req }) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc){
                return Promise.reject('E-mail address already exist')
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({ min: 5}),
    body('name').trim().not().isEmpty()
], authController.signup);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus );

router.put('/status', isAuth,[
    body('status')
    .trim()
    .not()
    .isEmpty()
], authController.getUpdateStatus)

module.exports = router;