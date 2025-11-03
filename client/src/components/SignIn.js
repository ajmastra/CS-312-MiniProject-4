import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/* ---------- sign in component ---------- */

export default function SignIn({ onSignIn }) {
    // state for username input
    const [userId, setUserId] = useState('');
    // state for password input
    const [password, setPassword] = useState('');
    // state for error message
    const [error, setError] = useState('');
    // loading state while submitting
    const [loading, setLoading] = useState(false);
    // navigate hook for routing
    const navigate = useNavigate();

    // handle form submission
    const handleSubmit = async (e) => {
        // prevent default form submission
        e.preventDefault();
        // clear any previous errors
        setError('');
        // set loading state
        setLoading(true);

        // start try catch for api call
        try {
            // call backend to sign in
            const response = await axios.post('/signin', {
                user_id: userId,
                password: password
            });

            // if sign in successful
            if (response.data.success) {
                // call parent callback with user data
                onSignIn(response.data.user);
                // redirect to posts page
                navigate('/posts');
            }
        } catch (err) {
            // get error message from response or use default
            const errorMsg = err.response?.data?.error || 'Sign in failed. Please try again.';
            setError(errorMsg);
            // show error alert to user
            alert(errorMsg);
        } finally {
            // always set loading to false after submission
            setLoading(false);
        }
    };

    return (
        <section className="row justify-content-center">
            <div className="col-12 col-lg-6">
                <div className="panel">
                    {/* panel header */}
                    <div className="panel-head">
                        <h2>Sign in</h2>
                    </div>
                    {/* sign in form */}
                    <form onSubmit={handleSubmit} className="vstack gap-3">
                        {/* username input */}
                        <input
                            className="form-control input-dark"
                            name="user_id"
                            placeholder="Username"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                        {/* password input */}
                        <input
                            className="form-control input-dark"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {/* submit button */}
                        <button className="btn btn-accent" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                    {/* error message display */}
                    {error && <div className="mt-2 text-danger small">{error}</div>}
                </div>
            </div>
        </section>
    );
}
