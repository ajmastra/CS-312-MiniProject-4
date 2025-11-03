'use strict';

// necessary includes 
const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const { Pool } = require('pg');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; 


/* ---------- middleware setup ---------- */

// CORS configuration for React frontend
app.use(cors({
    origin: 'http://localhost:3001', // React dev server port
    credentials: true // Allow cookies/sessions
}));

// JSON and URL encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// postgres connection pool (reads DATABASE_URL from .env)
const pool = new Pool({connectionString: process.env.DATABASE_URL});

// sessions stored in memory
app.use(session({
    // session secret
    secret: process.env.SESSION_SECRET || 'dev',
    // dont force resave when unmodified
    resave: false, 
    // dont save empty sessions
    saveUninitialized: false, 
    cookie: {
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' 
    }
}));


/* ---------- "database" (in-memory) ---------- */

// initialize array of categories (for bonus part of mini project 1)
const CATEGORIES = ['Outdoors', 'Music', 'Gym', 'Tech News', 'Food'];


// initialize the array to hold all of the posts, this is our "db" (no longer needed for project 3)
// let POSTS = []; 

// initialize counter to generate the next id for each new post (no longer needed for project 3)
// let NEXT_ID = 1;


/* ---------- helper functions ---------- */

// generate a unique id for the next post, just increment from where we were 
    // from the previous post (NO LONGER USED IN PROJECT 3)
/*
function nextPostId() {
    return NEXT_ID++;
}
*/

// format a js date so its ready for display (short style)
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

// initialize function to handle getting the index of a post in the post array ( NO LONGER USED IN PROJECT 3)
/*
function findPostById(id){
    for(var i = 0; i < POSTS.length; i++){
        // check current post at current index if equal to id we are looking for
        if(POSTS[i].id === id){
            // if so return it
            return i; 
        }
    }
    // return -1 if we couldnt find the post in the array
    return -1;
}
*/

// create a demo post when the app runs
/* NO LONGER USED IN PROJECT 3
POSTS.push({
    id: nextPostId(),
    authorName: 'AJ Mastrangelo',
    title: 'Welcome to my Mini Project 1!',
    content: 'This project has been pretty fun to do, and I have enjoyed working with Express once again!',
    category: 'Tech News',
    createdAt: new Date()
});
*/


/* ---------- routes --------- */

// root route, redirect to react frontend or return API info
app.get('/', (req, res) => {
    // if this is an api request (Accept: application/json header), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {

        res.json({ message: 'Blog API', endpoints: { posts: '/posts', auth: '/api/auth/check' } });

    } else
    {
        // otherwise redirect to React frontend 
        res.redirect('http://localhost:3001');
    }
});

// ROUTE FOR GETTING HOME PAGE
app.get('/posts', async (req, res, next) => {

    // initialize selected category
    const selectedCategory = req.query.category || ''; 

    // start try catch block for async/await on db calls
    try {
        // filter by category if user has selected one, otherwise show all posts

        // pull from database
        var sql = `
            SELECT 
                blog_id AS id, 
                creator_name AS "authorName", 
                title, 
                body AS content, 
                category, 
                date_created AS "createdAt",
                creator_user_id
            FROM blogs
        `;
        const params = []; // query parameters to prevent sql injection

        // check for category filter active
        if(selectedCategory){
            sql += ' WHERE category = $1';

            // add category to params
            params.push(selectedCategory);
        }

        // order by most recent
        sql += ' ORDER BY date_created DESC';

        // run query
        const {rows} = await pool.query(sql, params);
        const visible = rows; 

        // return JSON for React frontend
        res.json({
            posts: visible,
            categories: CATEGORIES,
            selectedCategory
        });
    } catch (e) {

        next(e);
    }
});

// ROUTE FOR CREATING A NEW POST
app.post('/posts', async (req, res, next) => {

    // require a signed in user to create posts
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // pull display name from session
    let author = req.session.user.name; 
    // title from form
    let title = req.body.title; 
    // body/content from form
    let body = req.body.content; 
     // category from form
    let category = req.body.category;

    // check to make sure fields are filled out
    if (!author || !title || !body) {
        // return 400 bad request if missing
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    // sanity check on category
        // make sure it is one of the allowed ones default to first one otherwise
    if(CATEGORIES.indexOf(category) === -1) {
        // use first known category if invalid
        category = CATEGORIES[0]; 
    }

    // start try catch for insertion and redirect
    try {
        // insert post into database (blogs table)
        const result = await pool.query(
            `INSERT INTO blogs (creator_user_id, creator_name, title, body, category)
             VALUES ($1,$2,$3,$4,$5) RETURNING blog_id AS id`,
            [req.session.user.user_id, author.trim(), title.trim(), body.trim(), category]
        );

        // return created post ID
        res.status(201).json({ 
            success: true, 
            postId: result.rows[0].id 
        });
    } catch (e) {

        next(e);
    }
});

// EDIT FORM ROUTE
app.get('/posts/:id/edit', async (req, res, next) => {

    // grab id number of post to edit
    var id = Number(req.params.id);

    // start try catch to fetch the post from the database
    try {

        // fetch the post from the db
        const {rows} = await pool.query(
            'SELECT blog_id AS id, creator_user_id, creator_name AS "authorName", title, body AS content, category FROM blogs WHERE blog_id=$1',
            [id]
        );

        // if post not found
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' }); 
        }

        // only the creator may edit (ownership check)
        // grab post
        const post = rows[0]; 
        // check if user signed in and owns the post
        if (!req.session.user || post.creator_user_id !== req.session.user.user_id) {
            return res.status(403).json({ error: 'You do not own this post.' });
        }

        // return post data for React form
        res.json({
            post, 
            categories: CATEGORIES
        });
    } catch (e) {

        next(e);
    }
});

// UPDATE POST ROUTE (PUT)
app.put('/posts/:id', async (req, res, next) => {

    // initialize post id and index
    const id = Number(req.params.id);

    // start try catch for db update
    try {
        // check for if the post exists
        let {rows} = await pool.query(
            'SELECT creator_user_id FROM blogs WHERE blog_id=$1', [id]
        );

        // if not return 404
        if(!rows.length) {
            return res.status(404).json({ error: 'Post not found.' }); 
        }

        // check ownership before allowing edit
        if (!req.session.user || rows[0].creator_user_id !== req.session.user.user_id) {
            return res.status(403).json({ error: 'You do not own this post.' });
        }

        // incoming fields
        const { title, content, category } = req.body;

        // keep or nullify category
        let safeCategory;
        if (CATEGORIES.includes(category)) {
            safeCategory = category;
        } else {
            safeCategory = null;
        }

        // only update the updated fields, if there is anything to update
        await pool.query(
            `UPDATE blogs
               SET title = COALESCE(NULLIF($1,''), title),
                   body = COALESCE(NULLIF($2,''), body),
                   category = COALESCE($3, category),
                   date_updated = NOW()
             WHERE blog_id = $4`,
            [title?.trim(), content?.trim(), safeCategory, id]
        );

        // return success
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

// ROUTE FOR POST DELETION
app.delete('/posts/:id', async (req, res, next) => {

    // initialize post id
    const idToDelete = Number(req.params.id);

    // start try catch for db deletion
    try {
        // look for the post
        const { rows } = await pool.query(
            'SELECT creator_user_id FROM blogs WHERE blog_id=$1',
            [idToDelete]
        );

        // if not found return 404
        if(rows.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        // check for ownership before allowing delete
        if (!req.session.user || rows[0].creator_user_id !== req.session.user.user_id) {
            return res.status(403).json({ error: 'You do not own this post.' });
        }

        // delete the post
        await pool.query('DELETE FROM blogs WHERE blog_id=$1', [idToDelete]);
        
        // return success
        res.json({ success: true });

    } catch (e) {
        next(e);
    }
});


// ------- AUTH ROUTES -------

// Check authentication status endpoint
app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// sign in form endpoint (returns categories for React)
app.get('/signin', (req, res) => {
    // check if user already signed in
    if (req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }
    res.json({ authenticated: false });
});



// handle sign in (POST)
app.post('/signin', async (req, res, next) => {

     // grab user input from form
    const { user_id, password } = req.body;

    // start try catch for db lookup
    try {

        // look for user in db
        const {rows} = await pool.query(
            'SELECT user_id, password, name FROM users WHERE user_id=$1',
            [user_id]
        );

        // check if username exists
        if (rows.length === 0) { 
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // check password 
        if (password !== rows[0].password) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // success, set session user
        req.session.user = { user_id: rows[0].user_id, name: rows[0].name };
        // return success with user info
        res.json({ 
            success: true, 
            user: req.session.user 
        });

    } catch (e) {
        next(e);
    }
});


// sign up form endpoint
app.get('/signup', (req, res) => {
    // if already signed in, return user info
    if (req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }
    res.json({ authenticated: false });
});


// handle sign up (POST)
app.post('/signup', async (req, res, next) => {
    const { user_id, password, name } = req.body;

    if (!user_id || !password || !name) {
        return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    try {
        // check if anyone already has this login
        const check = await pool.query('SELECT 1 FROM users WHERE user_id = $1', [user_id]);

        // if so, return error
        if (check.rowCount) {
            return res.status(409).json({ error: 'That username is already taken.' });
        }

        // insert new user into db 
        await pool.query(
            'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
            [user_id, password, name]
        );

        res.status(201).json({ success: true });
    } catch (e) {
        next(e);
    }
});


// handle sign out (POST)
app.post('/signout', (req, res) => {
    // clear session then return success
    req.session.destroy(e => {
        if (e) console.error('logout error:', e);
        res.json({ success: true });
    });
});


// 404 catch
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found.' });
});

// Error handler middleware (must be last)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error' 
    });
});


/* ---------- server ---------- */
app.listen(PORT, () => {
    console.log(`project 1 running at http://localhost:${PORT}`);
});
