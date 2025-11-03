import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/* ---------- sign up component ---------- */

export default function SignUp() {
    // state for username input
    const [userId, setUserId] = useState('');
    // state for password input
    const [password, setPassword] = useState('');
    // state for display name input
    const [name, setName] = useState('');
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
            // call backend to create new user account
            const response = await axios.post('/signup', {
                user_id: userId,
                password: password,
                name: name
            });

            // if sign up successful
            if (response.data.success) {
                // redirect to sign in page
                navigate('/signin');
            }
        } catch (err) {
            // get error message from response or use default
            const errorMsg = err.response?.data?.error || 'Sign up failed. Please try again.';
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
                        <h2>Create account</h2>
                    </div>
                    {/* sign up form */}
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
                        {/* display name input */}
                        <input
                            className="form-control input-dark"
                            name="name"
                            placeholder="Display name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        {/* submit button */}
                        <button className="btn btn-accent" type="submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                        {/* link to sign in page */}
                        <Link to="/signin" className="btn btn-ghost">
                            Already have an account?
                        </Link>
                    </form>
                    {/* error message display */}
                    {error && <div className="mt-2 text-danger small">{error}</div>}
                </div>
            </div>
        </section>
    );
}