/* ---------- footer component ---------- */

// simple footer component with app info
export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="container text-center small">
                {/* footer text */}
                <span>Built with Express & React | AJ Mastrangelo</span>
            </div>
        </footer>
    );
}