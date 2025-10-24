import React from 'react';
import { Link } from 'react-router-dom';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = React.useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  const handleButtonClick = () => {
    onSearch(query);
  };

  return (
    <div className="it-sv-details-sidebar-search mb-55">
      <input
        type="text"
        placeholder="Buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button type="button" onClick={handleButtonClick}>
        <i className="fal fa-search"></i>
      </button>
    </div>
  );
};

const TagsWidget = ({ tags, onTagClick, selectedTags }) => (
  <div className="it-sv-details-sidebar-widget">
    <h4 className="it-sv-details-sidebar-title mb-30">Categorias Populares:</h4>
    <div className="sidebar__widget-content">
      <div className="tagcloud">
        {tags.map((tag, index) => (
          <a
            key={index}
            href="/news"
            onClick={(e) => {
              e.preventDefault();
              onTagClick(tag);
            }}
            className={selectedTags.includes(tag) ? 'selected-tag' : ''}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  </div>
);

export const RecentPosts = ({ posts }) => {
  const recentPosts = posts.slice(0, 5);

  return (
    <div className="sidebar__widget mb-55">
      <div className="sidebar__widge-title-box">
        <h3 className="sidebar__widget-title pb-10">Noticias Recientes</h3>
      </div>
      <div className="sidebar__widget-content">
        <div className="sidebar__post">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              className="rc__post mb-30 d-flex align-items-start"
            >
              <div className="rc__post-thumb mr-20">
                <Link to={`/news-details/${post.id}`}>
                  {post.blogImages?.[0] ? (
                    <img
                      src={post.blogImages[0]}
                      alt={post.title || 'Post Thumbnail'}
                    />
                  ) : (
                    <div className="no-image-placeholder">No Image</div>
                  )}
                </Link>
              </div>
              <div className="rc__post-content">
                <div className="rc__meta">
                  <span>
                    <i className="fa-solid fa-calendar-days"></i>{' '}
                    {post.publishedDate || 'Fecha no disponible'}
                  </span>
                </div>
                <h3 className="rc__post-title">
                  <Link to={`/news-details/${post.id}`}>{post.title || 'Título no disponible'}</Link>
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ posts, tags, onSearch, onTagClick, selectedTags }) => (
  <div className="it-sv-details-sidebar">
    <SearchBar onSearch={onSearch} />
    <TagsWidget tags={tags} onTagClick={onTagClick} selectedTags={selectedTags} />
    <RecentPosts posts={posts} />
  </div>
);
export default Sidebar;