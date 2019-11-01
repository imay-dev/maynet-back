const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

// Post Model
const Post = require('../../models/Post')
// Profile Model
const Profile = require('../../models/Profile')


// Validation
const validatePostInput = require('../../validation/post')


// @route   GET api/posts/test
// @desc    Tests posts router
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Posts Module Works"}))


// @route   GET api/posts
// @desc    Get Posts
// @access  Public
router.get('/', (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ nopost: 'No Posts Found' }))
})


// @route   GET api/posts/:id
// @desc    Get Post by id
// @access  Public
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({ nopost: 'No Post Found' }))
})


// @route   POST api/posts
// @desc    Create Post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body)

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    })

    newPost.save().then(post => res.json(post))
})


// @route   DELETE api/posts/:id
// @desc    Delete Post by id
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for Post Owner
                    if (post.user.toString() !== req.user.id) {
                        return res.status(401).json({ notauthorized: 'User Not Authorized' })
                    }

                    // Delete
                    post.remove().then(() => res.json({ success: true }))
                })
                .catch(err => res.status(404).json({ nopost: 'No Post Found' }))
        })
})


// @route   POST api/posts/like/:id
// @desc    Like a Post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                        return res.status(400).json({ alreadyliked: 'User Already Liked this Post' })
                    }

                    // Add User id to Likes Array
                    post.likes.unshift({ user: req.user.id })

                    // Save
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ nopost: 'No Post Found' }))
        })
})


// @route   POST api/posts/unlike/:id
// @desc    Unike a Post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                        return res.status(400).json({ notliked: 'User Has Not yet Liked this Post' })
                    }

                    // Get Remove Index
                    const removeIndex = post.likes
                        .map(item => item.user.toString())
                        .indexOf(req.user.id)

                    // Splice out of Array
                    post.likes.splice(removeIndex, 1)

                    // Save
                    post.save().then(post => res.json(post))

                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ nopost: 'No Post Found' }))
        })
})


// @route   POST api/posts/comment/:id
// @desc    Add Comment to Post
// @access  Private
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body)

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    Post.findById(req.params.id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name: req.body.name,
                avatar: req.body.avatar,
                user: req.user.id
            }

            // Add to Comments Array
            post.comments.unshift(newComment)

            // Save
            post.save().then(post => res.json(post))
        })
        .catch(err => res.json(404).json({ nopost: 'No Post Found' }))
})


// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete Comment from Post
// @access  Private
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            // Check to see if Comment Exists
            if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
                return res.status(404).json({ nocomment: 'No Comment Found' })
            }

            // Get Remove Index
            const removeIndex = post.comments
                .map(item => item._id.toString())
                .indexOf(req.params.comment_id)

            // Splice Comment out of Array
            post.comments.splice(removeIndex, 1)

            // Save
            post.save().then(post => res.json(post))
        })
        .catch(err => res.json(404).json({ nopost: 'No Post Found' }))
})


module.exports = router