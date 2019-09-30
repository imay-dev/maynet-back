const express = require('express')
const router = express.Router()

// @route   GET api/profiles/test
// @desc    Tests profiles router
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Profiles Module Works"}))


module.exports = router