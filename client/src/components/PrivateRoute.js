import { Navigate } from 'react-router-dom';

/* ---------- private route component ---------- */

// component to protect routes that require authentication
export default function PrivateRoute({ children, isAuthenticated }) {
    // if authenticated, render the protected component
    // otherwise redirect to sign in page
    return isAuthenticated ? children : <Navigate to="/signin" replace />;
}