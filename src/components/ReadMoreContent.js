"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ReadMoreContent Component
export default function ReadMoreContent({ content, maxHeightPercentage = 50 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      const fullHeight = contentRef.current.scrollHeight;
      const calculatedHeight = (fullHeight * maxHeightPercentage) / 100;
      setCollapsedHeight(calculatedHeight);

      // Show button only if content is taller than collapsed height + threshold
      setShowButton(fullHeight > calculatedHeight + 50);
    }
  }, [content, maxHeightPercentage]);

  // Clean content of excessive non-breaking spaces that prevent wrapping
  const cleanContent = React.useMemo(() => {
    if (!content) return "";
    // Replace &nbsp; with regular space so browser can wrap lines naturally
    return content.replace(/&nbsp;/g, " ");
  }, [content]);

  return (
    <div className="relative w-full">
      <div
        ref={contentRef}
        className="prose prose-invert max-w-none text-[#D3D3D3] leading-relaxed text-lg 
                   prose-p:mb-4 prose-headings:text-[#FFCA20] transition-all duration-500 ease-in-out 
                   [&>img]:max-w-full [&>img]:h-auto custom-prose"
        style={{
          maxHeight: isExpanded ? "none" : `${collapsedHeight}px`,
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />

      {showButton && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 text-[#FFCA20] hover:text-[#ffda50] 
                       cursor-pointer font-semibold text-lg transition-colors duration-200 group focus:outline-none"
          >
            <span className="underline decoration-2 underline-offset-4 decoration-[#FFCA20]/50 
                             group-hover:decoration-[#FFCA20] transition-all">
              {isExpanded ? "Read Less" : "Read More"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
