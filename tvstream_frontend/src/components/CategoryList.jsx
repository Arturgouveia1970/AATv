import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCategoriesSmart } from '../services/dataSource';

export default function CategoryList({ selectedCategorySlug, onSelect }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCategoriesSmart();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p>{t('loading')}...</p>;
  }

  return (
    <div>
      <h2>{t('')}</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 , marginTop: 50 }}>
        {categories.map(cat => {
          // Handle both object and string
          const slug = typeof cat === 'object' ? cat.slug || cat.id || String(cat) : String(cat);
          const label = typeof cat === 'object' ? cat.name || cat.slug || String(cat) : String(cat);

          return (
            <li key={slug} style={{ marginBottom: '0.5rem' }}>
              <button
                onClick={() => onSelect(slug)}
                style={{
                  backgroundColor: selectedCategorySlug === slug ? '#007bff' : '#f0f0f0',
                  color: selectedCategorySlug === slug ? '#fff' : '#000',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                {t(slug, label)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
