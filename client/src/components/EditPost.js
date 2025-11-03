import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

/* ---------- edit post component ---------- */
export default function EditPost({ user }) {
  // grab post id from url params
  const { id } = useParams()
  // navigate hook for routing
  const nav = useNavigate()
  // state for post data from backend
  const [post, setPost] = useState(null)
  // state for available categories
  const [cats, setCats] = useState([])
  // state for author name input
  const [auth, setAuth] = useState('')
  // state for title input
  const [ttl, setTtl] = useState('')
  // state for selected category
  const [cat, setCat] = useState('')
  // state for content input
  const [txt, setTxt] = useState('')
  // loading state while fetching post
  const [load, setLoad] = useState(true)
  // submitting state while saving changes
  const [saving, setSaving] = useState(false)
  // error message state
  const [err, setErr] = useState('')

  // fetch post data when component mounts or id changes
  useEffect(() => {
    fetchPost()
  }, [id])

  // function to fetch post data from backend
  const fetchPost = async () => {
    // start try catch for api call
    try {
      // call backend to get post data for editing
      const res = await axios.get(`/posts/${id}/edit`)
      // grab post data from response
      const p = res.data.post
      // grab categories from response
      const c = res.data.categories || []

      // set post state
      setPost(p)
      // set categories state
      setCats(c)
      // pre-fill form fields with existing post data
      setAuth(p.authorName || '')
      setTtl(p.title || '')
      setCat(p.category || c[0] || '')
      setTxt(p.content || '')
    } catch (e) {
      // log error if fetch fails
      console.error('Error fetching post:', e)
      // get error message from response or use default
      const m = e.response?.data?.error || 'Failed to load post'
      setErr(m)
      // show error alert to user
      alert(m)
      // redirect back to posts page
      nav('/posts')
    } finally {
      // always set loading to false after fetch
      setLoad(false)
    }
  }

  // handle form submission
  const handleSubmit = async (e) => {
    // prevent default form submission
    e.preventDefault()
    // clear any previous errors
    setErr('')
    // set submitting state
    setSaving(true)

    // start try catch for api call
    try {
      // call backend to update post
      const r = await axios.put(`/posts/${id}`, {
        authorName: auth.trim(),
        title: ttl.trim(),
        category: cat,
        content: txt.trim()
      })

      // if update successful
      if (r.data.success) {
        // redirect back to posts page
        nav('/posts')
      }
    } catch (e) {
      // get error message from response or use default
      const m = e.response?.data?.error || 'Failed to update post'
      setErr(m)
      // show error alert to user
      alert(m)
    } finally {
      // always set submitting to false after submission
      setSaving(false)
    }
  }

  // show loading state while fetching post
  if (load) {
    return (
      <section className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="panel">
            <div className="loading">Loading post...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="panel">
          {/* panel header */}
          <div className="panel-head">
            <h2>Edit Post</h2>
          </div>

          {/* edit post form */}
          <form onSubmit={handleSubmit} className="vstack gap-3">
            {/* author name field */}
            <div>
              <label className="form-label" htmlFor="authorName">Your name</label>
              <input
                className="form-control input-dark"
                id="authorName"
                value={auth}
                onChange={v => setAuth(v.target.value)}
                required
              />
            </div>

            {/* title field */}
            <div>
              <label className="form-label" htmlFor="title">Title</label>
              <input
                className="form-control input-dark"
                id="title"
                value={ttl}
                onChange={v => setTtl(v.target.value)}
                required
              />
            </div>

            {/* category dropdown */}
            <div>
              <label className="form-label" htmlFor="category">Category</label>
              <select
                className="form-select input-dark"
                id="category"
                value={cat}
                onChange={v => setCat(v.target.value)}
                required
              >
                {/* map through categories to create options */}
                {cats.map(c => (
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
                rows="9"
                value={txt}
                onChange={v => setTxt(v.target.value)}
                required
              />
            </div>

            {/* error message display */}
            {err && <div className="text-danger small">{err}</div>}

            {/* save and cancel buttons */}
            <div className="d-flex gap-2">
              <button className="btn btn-accent" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              {/* cancel button to go back without saving */}
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => nav('/posts')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}