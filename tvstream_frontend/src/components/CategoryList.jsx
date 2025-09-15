// src/components/CategoryList.jsx
import React, { useEffect, useState } from 'react';
import { fetchCategoriesSmart } from '../services/dataSource';

export default function CategoryList({ selectedCategorySlug, onSelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const cats = await fetchCategoriesSmart();
        if (alive) setCategories(cats);
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="cat-note">Loading…</div>;
  if (err) return <div className="cat-note">Failed to load categories.</div>;
  if (!categories?.length) return <div className="cat-note">No categories.</div>;

  return (
    <ul className="cat-list" role="listbox" aria-label="Categories">
      {categories.map((c) => {
        const active = c.slug === selectedCategorySlug;
        return (
          <li key={c.slug}>
            <button
              type="button"
              className={`cat-item ${active ? 'is-active' : ''}`}
              onClick={() => onSelect?.(c.slug)}
              aria-pressed={active}
            >
              <span className="cat-name">{c.name}</span>
              <span className="cat-dot" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
