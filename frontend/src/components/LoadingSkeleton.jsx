// ✨ Loading Skeleton Component for better UX
import React from 'react';
import './LoadingSkeleton.css';

export const CardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-header"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line short"></div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

export const MapSkeleton = () => (
  <div className="skeleton-map">
    <div className="skeleton-pulse"></div>
    <div className="skeleton-map-text">Loading map...</div>
  </div>
);

export const StatsSkeleton = () => (
  <div className="skeleton-stats">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="skeleton-stat-card">
        <div className="skeleton-icon"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className="skeleton-line"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="skeleton-line"></div>
        ))}
      </div>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="skeleton-page">
    <div className="skeleton-header large"></div>
    <div className="skeleton-content">
      <ListSkeleton count={5} />
    </div>
  </div>
);

const LoadingSkeleton = ({ type = 'card', ...props }) => {
  switch (type) {
    case 'list':
      return <ListSkeleton {...props} />;
    case 'map':
      return <MapSkeleton />;
    case 'stats':
      return <StatsSkeleton />;
    case 'table':
      return <TableSkeleton {...props} />;
    case 'page':
      return <PageSkeleton />;
    default:
      return <CardSkeleton />;
  }
};

export default LoadingSkeleton;