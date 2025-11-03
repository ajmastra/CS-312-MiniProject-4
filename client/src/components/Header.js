import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* ---------- header component ---------- */

export default function Header({ user, onSignOut }) {
    // navigate hook for routing
    const navigate = useNavigate();

    // handle sign out button click
    const handleSignOut = async () => {
        // start try catch for api call
        try {
            // call backend to sign out and destroy session
            await axios.post('/signout', {});
            // call parent callback to clear user state
            onSignOut();
            // redirect to sign in page
            navigate('/signin');
        } catch (error) {
            // log error if sign out fails
            console.error('Sign out error:', error);
        }
    };

    return (
        <header className="app-header">
            <div className="container d-flex align-items-center justify-content-between">
                {/* brand/logo link */}
                <Link to="/posts" className="brand">Mini-Project-4: React Integration</Link>
                <nav className="nav small">
                    {/* home link */}
                    <Link to="/posts" className="nav-link">Home</Link>
                    {/* show sign out if user is signed in, otherwise show sign in/up */}
                    {user ? (
                        /* sign out form */
                        <form onSubmit={(e) => { e.preventDefault(); handleSignOut(); }} className="d-inline ms-2">
                            <button className="btn btn-ghost btn-sm" type="submit">
                                Sign out ({user.name})
                            </button>
                        </form>
                    ) : (
                        /* sign in and sign up links */
                        <>
                            <Link to="/signin" className="nav-link">Sign in</Link>
                            <Link to="/signup" className="nav-link">Sign up</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
