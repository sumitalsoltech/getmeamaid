'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function CmsSection() {
  const {
    cmsContent,
    setCmsContent,
    cmsSaveLoading,
    handleSaveCmsContent
  } = useAdmin();

  return (
    <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-6 shadow-xs">
      <div className="flex justify-between items-baseline border-b pb-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 font-sans">Corporate Brand CMS Content Panel</h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">Edit home layouts, headings, test copy description blocks, and structural steps without modifying file codes.</p>
        </div>
        <button
          onClick={() => handleSaveCmsContent(cmsContent)}
          disabled={cmsSaveLoading}
          className="px-5 py-2 bg-[#fbbf24] text-black font-extrabold rounded-lg text-xs hover:bg-[#d9a21b] cursor-pointer disabled:opacity-50"
        >
          {cmsSaveLoading ? 'Saving changes...' : 'Publish Brand Changes'}
        </button>
      </div>

      {cmsContent ? (
        <div className="space-y-6">
          
          {/* Hero Section Configs */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-1">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Section 1: Landing Page Hero Area</span>
              <select
                value={cmsContent.hero?.status || 'draft'}
                onChange={(e) => {
                  setCmsContent({
                    ...cmsContent,
                    hero: { ...cmsContent.hero, status: e.target.value }
                  });
                }}
                className="p-1 text-[10px] bg-white border rounded font-bold cursor-pointer text-neutral-700"
              >
                <option value="draft">📁 DRAFT</option>
                <option value="published">🟢 PUBLISHED</option>
                <option value="inactive">🛑 INACTIVE</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10.5px] font-semibold text-neutral-500 block">Hero Title Greeting:</span>
                <input
                  type="text"
                  value={cmsContent.hero?.heading || ''}
                  onChange={(e) => {
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, heading: e.target.value }
                    });
                  }}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg outline-none font-sans text-neutral-950 font-bold"
                  placeholder="Enter premium greeting..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10.5px] font-semibold text-neutral-500 block">Subheading Brand Pitch Narrative:</span>
                <textarea
                  value={cmsContent.hero?.subheading || ''}
                  onChange={(e) => {
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, subheading: e.target.value }
                    });
                  }}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg outline-none h-16 leading-relaxed text-neutral-800"
                  placeholder="Describe your brand offerings..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: How It Works operational system */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-1">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Section 2: The Three-Step Transformation Flow</span>
              <span className="text-[9.5px] text-neutral-400 font-mono font-bold">LIVE HOMEPAGE COMPONENT LINK</span>
            </div>

            <div className="space-y-4">
              {cmsContent.howItWorks?.map((step: any, idx: number) => (
                <div key={idx} className="p-3 bg-white rounded-lg border flex flex-col md:flex-row gap-3 items-start justify-between">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-xl font-black text-neutral-300">0{idx + 1}</span>
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={step.title || ''}
                        onChange={(e) => {
                          const updatedHow = [...cmsContent.howItWorks];
                          updatedHow[idx].title = e.target.value;
                          setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                        }}
                        className="text-xs font-bold font-sans text-neutral-950 border-b outline-none pb-0.5 focus:border-[#fbbf24] text-neutral-800"
                        placeholder="Step Title"
                      />
                      <input
                        type="text"
                        value={step.description || ''}
                        onChange={(e) => {
                          const updatedHow = [...cmsContent.howItWorks];
                          updatedHow[idx].description = e.target.value;
                          setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                        }}
                        className="text-[10.5px] font-sans text-neutral-500 w-[300px] sm:w-[450px] border-none outline-none focus:ring-0 focus:border-b"
                        placeholder="Description..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[10.5px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={step.is_active !== false}
                        onChange={(e) => {
                          const updatedHow = [...cmsContent.howItWorks];
                          updatedHow[idx].is_active = e.target.checked;
                          setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                        }}
                        className="rounded border-neutral-300 cursor-pointer"
                      />
                      <span>Active step</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 text-center text-neutral-400 italic">Formatting live corporate assets from database. Wait a brief moment...</div>
      )}

    </div>
  );
}
