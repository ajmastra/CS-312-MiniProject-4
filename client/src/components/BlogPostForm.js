import { useState, useEffect } from 'react'
import axios from 'axios'

/* ---------- blog post form component ---------- */
export default function BlogPostForm({ user, categories, onPostCreated }) {
  // state for author name (pre-filled from user session)
  const [authorName, setAuthorName] = useState('')
  // state for post title
  const [title, setTitle] = useState('')
  // state for selected category
  const [category, setCategory] = useState('')
  // state for post content/body
  const [content, setContent] = useState('')
  // loading state while submitting
  const [loading, setLoading] = useState(false)
  // error message state
  const [error, setError] = useState('')

  // initialize form when user or categories change
  useEffect(() => {
    // set author name from user if available
    if (user) {
      setAuthorName(user.name || '')
    }
    // set default category to first one if available
    if (categories && categories.length > 0 && !category) {
      setCategory(categories[0])
    }
  }, [user, categories]) // category missing on purpose

  // handle form submission
  const handleSubmit = async (e) => {
    // prevent default form submission
    e.preventDefault()
    // clear any previous errors
    setError('')
    // set loading state
    setLoading(true)

    // check if required fields are filled
    if (!authorName || !title || !content) {
      // set error if missing fields
      setError('Please fill all required fields')
      setLoading(false)
      return
    }

    // start try catch for api call
    try {
      // call backend to create new post
      const response = await axios.post('/posts', {
        title: title.trim(),
        content: content.trim(),
        category: category || categories[0]
      })

      // if post created successfully
      if (response.data.success) {
        // clear form fields
        setTitle('')
        setContent('')
        setCategory(categories[0] || '')
        setError('')
        // notify parent component to refresh post list
        if (onPostCreated) {
          onPostCreated()
        }
      }
    } catch (err) {
      // get error message from response or use default
      const errorMsg = err.response?.data?.error || 'Failed to create post'
      setError(errorMsg)
      // show error alert to user
      alert(errorMsg)
    } finally {
      // always set loading to false after submission
      setLoading(false)
    }
  }

  // handle reset button
  const handleReset = () => {
    // clear all form fields
    setTitle('')
    setContent('')
    setCategory(categories[0] || '')
    setError('')
  }

  return (
    <aside className="col-12 col-lg-5">
      <div className="panel">
        {/* panel header */}
        <div className="panel-head">
          <h2>Create a Post</h2>
        </div>

        {/* create post form */}
        <form onSubmit={handleSubmit} className="vstack gap-3">
          {/* author name field (read-only) */}
          <div>
            <label className="form-label" htmlFor="authorName">Your name</label>
            <input
              className="form-control input-dark"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="AJ Mastrangelo"
              required
              readOnly
            />
          </div>

          {/* title field */}
          <div>
            <label className="form-label" htmlFor="title">Title</label>
            <input
              className="form-control input-dark"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Coding CS312 Project"
              required
            />
          </div>

          {/* category dropdown */}
          <div>
            <label className="form-label" htmlFor="category">Category</label>
            <select
              className="form-select input-dark"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {/* map through categories to create options */}
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* content textarea */}
          <div>
            <label className="form-label" htmlFor="content">Content</label>
            <textarea
              className="form-control input-dark"
              id="content"
              rows="7"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              required
            />
          </div>

          {/* error message display */}
          {error && <div className="text-danger small">{error}</div>}

          {/* submit and reset buttons */}
          <div className="d-flex gap-2">
            <button className="btn btn-accent" type="submit" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </aside>
  )
}