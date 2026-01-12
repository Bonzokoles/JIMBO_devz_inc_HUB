import React from "react";
import { api } from "@jimbo77/core/api";
import { PublishResponse } from "@jimbo77/core/types";

export function PublishingView() {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<PublishResponse[]>([]);
//   const [history, setHistory] = React.useState<any[]>([]); 

  // Load history on mount
  React.useEffect(() => {
    // TODO: api.publishHistory().then(setHistory).catch(console.error);
  }, []);

  const handlePublish = async () => {
    if (!title || !content) return;
    setLoading(true);
    setResults([]);

    try {
      /*
      // 1. Upload Image to R2 if selected
      if (file) {
        // const formData = new FormData();
        // formData.append("file", file);
        // await api.publishR2(formData);
      }
      */

      // 2. Publish
      // Construct markdown with frontmatter
      const markdown = `---
title: "${title}"
description: "${content.slice(0, 150)}..."
tags: AI, Jimbo77
---

${content}`;

      const res = await api.publishEverywhere({
        article_markdown: markdown,
        // image_path: ... // frontend can't send path
      });
      setResults(res);
    } catch (e: any) {
      console.error(e);
      setResults([{ id: "err", platform: "all", status: "failed", error: e.message, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ margin: 0 }}>OMNI PUBLISHER</h2>
        <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>Publish to Twitter, Blog, and Dev.to simultaneously.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Editor */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "var(--muted)", marginBottom: 4 }}>Title</label>
            <input
              className="btn"
              style={{ width: "96%", background: "var(--bg)", border: "1px solid var(--line)", textAlign:"left", cursor:"text" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title..."
            />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--muted)", marginBottom: 4 }}>Content (Markdown)</label>
            <textarea
              className="btn"
              style={{ 
                width: "96%", 
                minHeight: 300, 
                background: "var(--bg)", 
                border: "1px solid var(--line)", 
                fontFamily: "monospace",
                textAlign: "left",
                cursor: "text",
                whiteSpace: "pre-wrap"
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here..."
            />
          </div>

          <div>
             <small style={{display:"block", color:"var(--muted)"}}>*Image upload disabled (backend update needed)</small>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              className="btn" 
              style={{ background: "var(--hot)", color: "var(--bg)", fontWeight: "bold" }}
              onClick={handlePublish}
              disabled={loading}
            >
              {loading ? "PUBLISHING..." : "PUBLISH EVERYWHERE"}
            </button>
          </div>
        </div>

        {/* Results / History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {results.length > 0 && (
            <div className="card">
              <h3>Results</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                 {results.map((r, i) => (
                   <div key={i} style={{ 
                     padding: 10, 
                     background: r.status === "success" ? "rgba(124, 255, 178, .1)" : "rgba(255, 77, 109, .1)",
                     border: `1px solid ${r.status === "success" ? "var(--hot)" : "var(--bad)"}`,
                     borderRadius: 4
                   }}>
                     <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>{r.platform}</div>
                     <div style={{ fontSize: 12 }}>{r.status}</div>
                     {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{color: "var(--cold)"}}>View Link</a>}
                     {r.error && <div style={{color: "var(--bad)", fontSize: 11}}>{r.error}</div>}
                   </div>
                 ))}
              </div>
            </div>
          )}

           <div className="card">
              <div style={{ color: "var(--muted)" }}>LATEST POSTS</div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--faint)" }}>
                No history available.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
