const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const keys = require('../../config/keys')
const passport = require('passport')

// Load Validation
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')

// Load User Model
const User = require('../../models/User')


// @route   GET api/users/test
// @desc    Tests users router
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Users Module Works"}))


// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body)

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    User.findOne({
        email: req.body.email
    })
    .then(user => {
        if(user) {
            errors.email = 'Email already exists'
            return res.status(400).json(errors)
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm' // Default
            })

            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar: avatar,
                password: req.body.password
            })

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err
                    newUser.password = hash
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err))
                })
            })
        }
    })
    .catch(err => console.log(err))
})


// @route   POST api/users/login
// @desc    User Login
// @access  Public
router.post('/login', (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body)

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    const email = req.body.email
    const password = req.body.password

    // Find User by Email
    User
        .findOne({email})
        .then(user => {
            // Check for User
            if (!user) {
                errors.email = 'User Not Found'
                res.status(404).json(errors)
            }

            // Check Password
            bcrypt
                .compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        // User Matched
                        const payload = {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar
                        }

                        // Sign Token
                        jwt.sign(
                            payload,
                            keys.secretOrKey,
                            { expiresIn : 3600 },
                            (err, token) => {
                                res.json({
                                    success: true,
                                    token: 'Bearer ' + token
                                })
                            })
                    } else {
                        errors.password = 'Incorrect Password'
                        res.status(400).json(errors)
                    }
                })
        })
        .catch(err => console.log(err))
})


// @route   GET api/users/current
// @desc    Returns Current User
// @access  Public
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    })
})


module.exports = router