import React from 'react';
import './TaglineSection.css';

const TaglineSection = () => {
  return (
    <div className="tagline-card">
      <div className="tagline-content">
        <span className="tagline-eyebrow">Invoice manangement system</span>
        <h3>Track. Manage. Grow.</h3>
        <p>A lightweight invoice management system built with FastAPI, PostgreSQL and React — real-time CRUD without the overhead.</p>
        <div className="stack-badge">
          <span className="stack-item">FastAPI</span>
          <span className="stack-dot">•</span>
          <span className="stack-item">PostgreSQL</span>
          <span className="stack-dot">•</span>
          <span className="stack-item">React</span>
        </div>
      </div>
    </div>
  );
};

export default TaglineSection;