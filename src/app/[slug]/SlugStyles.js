'use client';

export default function SlugStyles() {
  return (
    <style jsx global>{`
      .cms-content h1, 
      .cms-content h2, 
      .cms-content h3, 
      .cms-content h4, 
      .cms-content h5, 
      .cms-content h6 {
        color: #FFCA20;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
        line-height: 1.3;
      }
      
      .cms-content h1 { font-size: 2.25rem; }
      .cms-content h2 { font-size: 1.875rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
      .cms-content h3 { font-size: 1.5rem; }
      .cms-content h4 { font-size: 1.25rem; }
      
      .cms-content p {
        margin-bottom: 1.25rem;
        line-height: 1.75;
        font-size: 1rem;
      }
      
      .cms-content ul, 
      .cms-content ol {
        margin-bottom: 1.25rem;
        padding-left: 1.5rem;
      }
      
      .cms-content ul { list-style-type: disc; }
      .cms-content ol { list-style-type: decimal; }
      
      .cms-content li {
        margin-bottom: 0.5rem;
        line-height: 1.7;
      }
      
      .cms-content a {
        color: #FFCA20;
        text-decoration: none;
        transition: all 0.2s;
      }
      
      .cms-content a:hover {
        text-decoration: underline;
        opacity: 0.8;
      }
      
      .cms-content strong, 
      .cms-content b {
        color: #fff;
        font-weight: 600;
      }
      
      .cms-content img {
        max-width: 100%;
        height: auto;
        display: block;
        border-radius: 0.5rem;
        margin: 1.5rem 0;
      }

      .cms-content iframe {
        max-width: 100%;
        margin: 1.5rem 0;
      }
      
      .cms-content blockquote {
        border-left: 4px solid #FFCA20;
        padding-left: 1rem;
        margin-left: 0;
        margin-bottom: 1.25rem;
        font-style: italic;
        color: #a0a0a0;
      }
    `}</style>
  );
}
