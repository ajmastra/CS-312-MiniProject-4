// imports!
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import PostList from './components/PostList';
import BlogPostForm from './components/BlogPostForm';
import EditPost from './components/EditPost';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

/* --------- axios configuration ------- */

// configure axios to include credentials by default and set the base URL
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:3000';

/* ---------- main app component ------------ */

function App() {
    // state for current user, null if not signed in
    const [user, setUser] = useState(null);

    // loading state for initial authh check
    const [loading, setLoading] = useState(true);

    // key to force post list refresh when new post is created
    const [postRefreshKey, setPostRefreshKey] = useState(0);

    // check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // function to check if user is authenticated
    const checkAuth = async () => {
        // start try catch for api call
        try {
            // call backend to check auth status
            const response = await axios.get('/api/auth/check');

            // if authenticated, set user data
            if (response.data.authenticated) {
                setUser(response.data.user);
            } 
            else {
                // otherwise clear user
                setUser(null);
            }
        } catch (error) {
            // log error if check fails
            console.error('Error checking auth:', error);
            setUser(null);
            
        } finally {
            // always set loading to false after check
            setLoading(false);
        }
    };

    // handle successful sign in
    const handleSignIn = (userData) => {
        // set user state with signed in user data
        setUser(userData);
    };

    // handle sign out
    const handleSignOut = () => {
        // clear user state
        setUser(null);
    };

    // handle when new post is created
    const handlePostCreated = () => {
        // increment refresh key to trigger post list re-fetch
        setPostRefreshKey(prev => prev + 1);
    };

    return (
        <Router>
            <div className="app">
                {/* header with navigation and auth status */}
                <Header user={user} onSignOut={handleSignOut} />
                <main className="container py-4">
                    {/* show loading while checking auth */}
                    {loading ? (
                        <div className="panel">
                            <div className="loading">Loading...</div>
                        </div>
                    ) : (
                        <Routes>
                            {/* redirect root to posts page */}
                            <Route path="/" element={<Navigate to="/posts" replace />} />
                            {/* sign in route */}
                            <Route
                                path="/signin"
                                element={
                                    // redirect to posts if already signed in
                                    user ? (
                                        <Navigate to="/posts" replace />
                                    ) : (
                                        // otherwise show sign in form
                                        <SignIn onSignIn={handleSignIn} />
                                    )
                                }
                            />
                            {/* sign up route */}
                            <Route
                                path="/signup"
                                element={
                                    // redirect to posts if already signed in
                                    user ? (
                                        <Navigate to="/posts" replace />
                                    ) : (
                                        // otherwise show sign up form
                                        <SignUp />
                                    )
                                }
                            />
                            {/* posts list route */}
                            <Route
                                path="/posts"
                                element={
                                    <div className="row g-4">
                                        {/* posts list on left side */}
                                        <PostList
                                            user={user}
                                            refreshKey={postRefreshKey}
                                        />
                                        {/* create post form on right side (only if signed in) */}
                                        {user && (
                                            <BlogPostForm
                                                user={user}
                                                categories={['Outdoors', 'Music', 'Gym', 'Tech News', 'Food']}
                                                onPostCreated={handlePostCreated}
                                            />
                                        )}
                                    </div>
                                }
                            />
                            {/* edit post route (protected) */}
                            <Route
                                path="/posts/:id/edit"
                                element={
                                    // wrap with private route to require auth
                                    <PrivateRoute isAuthenticated={!!user}>
                                        <EditPost user={user} />
                                    </PrivateRoute>
                                }
                            />
                            {/* 404 catch all route */}
                            <Route path="*" element={<div className="text-center py-5">Page not found.</div>} />
                        </Routes>
                    )}
                </main>
                {/* footer component */}
                <Footer />
            </div>
        </Router>
    );
}

export default App;
