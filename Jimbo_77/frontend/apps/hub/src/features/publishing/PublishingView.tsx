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

  const [category, setCategory] = React.useState("");
  const [brainstormLoading, setBrainstormLoading] = React.useState(false);
  const [logs, setLogs] = React.useState("");

  const handlePublish = async () => {
    if (!title || !content) return;
    setLoading(true);
    setResults([]);

    try {
      // 2. Publish
      // Construct markdown with frontmatter
      const markdown = `---
title: "${title}"
description: "${content.slice(0, 150).replace(/"/g, '')}..."
tags: AI, Jimbo77
---

${content}`;

      const res = await api.publishEverywhere({
        article_markdown: markdown,
      });
      setResults(res);
    } catch (e: any) {
      console.error(e);
      setResults([{ id: "err", platform: "all", status: "failed", error: e.message, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrainstorm = async () => {
     if (!category) return;
     setBrainstormLoading(true);
     setLogs("🧠 Initializing Agents... (This can take ~60s)\n");
     
     try {
         const res = await api.publisherBrainstorm(category);
         if (res.logs) setLogs(res.logs);
         
         if (res.status === "success" && res.content) {
             // Extract title from content if possible, or use filename

             let extractedTitle = "Generated Article";
             // Try to find title in frontmatter
             const titleMatch = res.content.match(/title:\s*"(.*)"/);
             if (titleMatch) extractedTitle = titleMatch[1];
             
             setTitle(extractedTitle);
             // Remove frontmatter from content display if preferred, or keep it
             // For editor, let's keep the raw content but strip duplicated frontmatter if we re-add it in publish
             // Actually, publishEverywhere ADDS frontmatter. So we should probably strip it here.
             const body = res.content.replace(/---[\s\S]*?---/, "").trim();
             setContent(body);
         } else {
             setLogs(prev => prev + "\n❌ Failed to generate content/find file.");
         }
     } catch (e: any) {
         setLogs(prev => prev + `\n❌ Error: ${e.message}`);
     } finally {
         setBrainstormLoading(false);
     }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 50 }}>
      {/* Header */}
      <div className="card" style={{ 
          borderLeft: "4px solid var(--neon)", 
          background: "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)",
          padding: "20px"
      }}>
        <h2 style={{ margin: 0, fontSize: "1.8rem", letterSpacing: "1px", paddingLeft: "20px" }}>OMNI PUBLISHER <span style={{color:"var(--neon)"}}>2.0</span></h2>
        <p style={{ color: "var(--muted)", margin: "8px 0 0", fontSize: "1.1rem", paddingLeft: "20px" }}>
            AI-Powered Content Engine: Brainstorm ➡️ Generate ➡️ Deploy
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24 }}>
        
        {/* LEFT: AI CONTROLS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* BRAINSTORM PANEL */}
            <div className="card" style={{ border: "1px solid var(--active)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <h3 style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10, margin: "0 0 15px 0", color: "var(--neon)", paddingLeft: 10 }}>
                    🧠 AI BRAINSTORM
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: "1.5", paddingLeft: 10 }}>
                    Input a high-level topic. The **MOA Swarm** (Research, SEO, Writer) will research trends and generate a full article.
                </p>
                
                <div style={{ marginTop: 20 }}>
                    <label style={{ display: "block", color: "var(--fg)", marginBottom: 8, fontWeight: "bold", paddingLeft: 10 }}>TARGET TOPIC</label>
                    <input
                      className="btn"
                      style={{ 
                          width: "92%", 
                          background: "var(--bg-dark)", 
                          border: "1px solid var(--line)", 
                          textAlign:"left", 
                          cursor:"text",
                          padding: "12px",
                          color: "var(--fg)",
                          fontSize: "1rem"
                      }}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Future of Furniture Design"
                    />
                </div>
                
                <div style={{ marginTop: 20 }}>
                    <button 
                      className="btn" 
                      style={{ 
                          width: "100%",
                          background: brainstormLoading ? "var(--muted)" : "var(--neon)", 
                          color: brainstormLoading ? "#fff" : "var(--bg)", 
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          padding: "14px",
                          letterSpacing: "1px"
                      }}
                      onClick={handleBrainstorm}
                      disabled={brainstormLoading}
                    >
                      {brainstormLoading ? "🧠 SWARM WORKING..." : "✨ GENERATE CONTENT"}
                    </button>
                </div>
            </div>
            
            {/* LOGS PANEL */}
            <div className="card" style={{ flex: 1, minHeight: 300, display: "flex", flexDirection: "column", border: "1px solid var(--line)" }}>
                <h3 style={{ fontSize: 14, textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
                    🕵️ AGENT TELEMETRY
                </h3>
                <pre style={{ 
                    flex: 1, 
                    background: "#0d0d0d", 
                    border: "1px solid #333",
                    padding: 12, 
                    fontSize: 11, 
                    fontFamily: "Consolas, Monaco, monospace",
                    overflow: "auto", 
                    borderRadius: 4, 
                    color: "#0f0", // Matrix green for logs
                    whiteSpace: "pre-wrap",
                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)"
                }}>
                    {logs || "> Waiting for mission..."}
                </pre>
            </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, border: "1px solid var(--fg)", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, right: 20, background: "var(--bg)", padding: "0 10px", color: "var(--active)", fontSize: 12, fontWeight: "bold", border: "1px solid var(--active)" }}>
                  LIVE EDITOR
              </div>

              <div>
                <label style={{ display: "block", color: "var(--muted)", marginBottom: 6, fontSize: 12, textTransform: "uppercase", paddingLeft: 10 }}>Article Title</label>
                <input
                  className="btn"
                  style={{ 
                      width: "98%", 
                      background: "var(--bg-dark)", 
                      border: "1px solid var(--line)", 
                      textAlign:"left", 
                      cursor:"text",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      padding: "12px"
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article Title..."
                />
              </div>
    
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: "var(--muted)", marginBottom: 6, fontSize: 12, textTransform: "uppercase", paddingLeft: 10 }}>Content Body (Markdown)</label>
                <textarea
                  className="btn"
                  style={{ 
                    width: "98%", 
                    minHeight: 600, 
                    background: "var(--bg-dark)", 
                    border: "1px solid var(--line)", 
                    fontFamily: "Consolas, Monaco, monospace",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    textAlign: "left",
                    cursor: "text",
                    whiteSpace: "pre-wrap",
                    padding: "20px",
                    color: "#e0e0e0"
                  }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or generate your article here..."
                />
              </div>
    
              <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  background: "var(--bg-dark)", 
                  padding: 15, 
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  marginTop: 10
              }}>
                 <div style={{ display:"flex",  gap: 15, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{width: 8, height: 8, borderRadius: "50%", background: "#2ecc71"}}></span> BLOG
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{width: 8, height: 8, borderRadius: "50%", background: "#3498db"}}></span> TWITTER
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{width: 8, height: 8, borderRadius: "50%", background: "#9b59b6"}}></span> DEV.TO
                    </span>
                 </div>
                 
                <button 
                  className="btn" 
                  style={{ 
                      background: loading ? "var(--muted)" : "#10b981", // Standard emerald-500, less neon
                      color: "white", 
                      fontWeight: "bold",
                      padding: "12px 30px",
                      boxShadow: "none", // Killed the glow completely
                  }}
                  onClick={handlePublish}
                  disabled={loading}
                >
                  {loading ? "🚀 DEPLOYING..." : "🚀 PUBLISH EVERYWHERE"}
                </button>
              </div>
            </div>
    
            {/* Results / History */}
            {results.length > 0 && (
                <div className="card" style={{ border: "1px solid var(--line)" }}>
                  <h3 style={{ margin: "0 0 15px 0" }}>Deployment Status</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                     {results.map((r, i) => (
                       <div key={i} style={{ 
                         padding: "15px", 
                         background: r.status === "success" ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)",
                         borderLeft: `4px solid ${r.status === "success" ? "#2ecc71" : "#e74c3c"}`,
                         borderTop: "1px solid var(--line)",
                         borderRight: "1px solid var(--line)",
                         borderBottom: "1px solid var(--line)",
                         borderRadius: 4,
                         display: "flex",
                         justifyContent: "space-between",
                         alignItems: "center"
                       }}>
                         <div>
                             <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 14 }}>{r.platform}</div>
                             <div style={{ fontSize: 12, marginTop: 4, color: r.status === "success" ? "#2ecc71" : "#e74c3c" }}>
                                 STATUS: {r.status.toUpperCase()}
                             </div>
                             {r.error && <div style={{color: "#e74c3c", fontSize: 11, marginTop: 4}}>{r.error}</div>}
                         </div>
                         
                         {r.url && (
                             <a 
                                href={r.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn"
                                style={{
                                    background: "rgba(255,255,255,0.1)", 
                                    fontSize: 12, 
                                    padding: "8px 15px"
                                }}
                             >
                                 VIEW LIVE ↗
                             </a>
                         )}
                       </div>
                     ))}
                  </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
