import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

/* ---------- helper functions ---------- */

// format a js date so its ready for display (short style)
function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(d))
}

/* ---------- post list component ---------- */
export default function PostList({ user, refreshKey }) {
  // state for array of posts from database
  const [posts, setPosts] = useState([])
  // state for array of available categories
  const [cats, setCats] = useState([])
  // state for currently selected category filter
  const [selCat, setSelCat] = useState('')
  // loading state while fetching posts
  const [load, setLoad] = useState(true)
  // navigate hook for routing
  const nav = useNavigate()

  // fetch posts when category filter changes or refresh key changes
  useEffect(() => {
    fetchPosts()
  }, [selCat, refreshKey])

  // function to fetch posts from backend
  const fetchPosts = async () => {
    // start try catch for api call
    try {
      // set loading state
      setLoad(true)
      // build url with category filter if one is selected
      const url = selCat
        ? `/posts?category=${encodeURIComponent(selCat)}`
        : '/posts'
      console.log('Fetching posts from:', url)
      // call backend api to get posts
      const r = await axios.get(url)
      console.log('Posts response:', r.data)
      // set posts from response
      setPosts(r.data.posts || [])
      // set categories from response
      setCats(r.data.categories || [])
      // set selected category from response
      setSelCat(r.data.selectedCategory || '')
    } catch (e) {
      // log error if fetch fails
      console.error('Error fetching posts:', e)
      console.error('Error details:', e.response?.data || e.message)
      // show error alert to user
      alert(
        `Error loading posts: ${
          e.response?.data?.error || e.message || 'Unknown error'
        }`
      )
      // clear posts and categories on error
      setPosts([])
      setCats([])
    } finally {
      // always set loading to false after fetch
      setLoad(false)
    }
  }

  // handle when user changes category filter
  const handleCatChange = (e) => {
    // set selected category from dropdown
    setSelCat(e.target.value)
  }

  // handle reset filter button
  const resetFilter = () => {
    // clear category filter
    setSelCat('')
  }

  // handle delete button click
  const handleDel = async (pid) => {
    // confirm deletion with user
    if (!window.confirm('Delete this post?')) {
      // if user cancels, return early
      return
    }

    // start try catch for delete api call
    try {
      // call backend to delete post
      await axios.delete(`/posts/${pid}`)
      // refresh the list after deletion
      fetchPosts()
    } catch (e) {
      // log error if delete fails
      console.error('Error deleting post:', e)
      // show error alert to user
      alert(e.response?.data?.error || 'Failed to delete post')
    }
  }

  // show loading state while fetching
  if (load) {
    return (
      <section className="col-12 col-lg-7">
        <div className="panel">
          <div className="loading">Loading posts...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="col-12 col-lg-7">
      <div className="panel">
        {/* panel header with filter dropdown */}
        <div className="panel-head d-flex align-items-center justify-content-between">
          <h2>Posts</h2>

          {/* category filter dropdown */}
          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted m-0" htmlFor="filterCategory">
              Filter
            </label>
            <select
              className="form-select form-select-sm select-accent"
              id="filterCategory"
              name="category"
              value={selCat}
              onChange={handleCatChange}
            >
              <option value="">All</option>
              {/* map through categories to create options */}
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* reset button only shown when filter is active */}
            {selCat && (
              <button className="btn btn-sm btn-ghost" onClick={resetFilter}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* empty state if no posts */}
        {posts.length === 0 ? (
          <div className="empty">
            <p>No posts yet. Be the first to post something!</p>
          </div>
        ) : (
          /* post stack */
          <div className="vstack gap-3">
            {/* map through posts and render each one */}
            {posts.map((p) => (
              <article key={p.id} className="post">
                {/* post header with title, meta, and category badge */}
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="flex-grow-1">
                    {/* post title */}
                    <h3>{p.title}</h3>
                    {/* post meta info (author and date) */}
                    <div className="meta">
                      by <strong>{p.authorName}</strong> •{' '}
                      <span>{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                  {/* category badge */}
                  <span className="badge badge-accent">{p.category}</span>
                </div>

                {/* post content */}
                <p className="content">{p.content}</p>

                {/* action buttons (only show if user owns the post) */}
                {user && user.user_id === p.creator_user_id && (
                  <div className="actions">
                    {/* edit button */}
                    <button
                      className="btn btn-sm btn-outline-accent"
                      onClick={() => nav(`/posts/${p.id}/edit`)}
                    >
                      Edit
                    </button>
                    {/* delete button */}
                    <button
                      className="btn btn-sm btn-danger-ghost"
                      onClick={() => handleDel(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}