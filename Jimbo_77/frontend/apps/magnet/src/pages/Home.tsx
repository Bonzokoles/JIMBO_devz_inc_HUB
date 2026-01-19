import { Link } from "react-router-dom";
import { PROJECTS, type ProjectMeta } from "../data/projects";
import { motion } from "framer-motion";

function ProjectCard({ p }: { p: ProjectMeta }) {
    return (
        <Link to={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
            <motion.div 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 40, 60, 0.4)" }}
                transition={{ duration: 0.2 }}
                style={{
                    background: "rgba(10, 15, 25, 0.7)",
                    border: "1px solid var(--line)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    height: "100%",
                    borderRadius: "8px"
                }}
            >
                <div style={{
                    position: "absolute",
                    top: 0, right: 0,
                    background: p.role === "public" ? "var(--success, #00C853)" : "rgba(100, 100, 100, 0.2)",
                    color: p.role === "public" ? "#000" : "var(--muted)",
                    fontSize: "10px",
                    padding: "2px 6px",
                    fontWeight: "bold",
                    fontFamily: "monospace"
                }}>
                    {p.role.toUpperCase()}
                </div>

                <h3 style={{ margin: 0, fontFamily: "monospace", letterSpacing: "1px", color: "var(--fg)" }}>
                    {p.name.toUpperCase()}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--primary)", opacity: 0.8 }}>
                    {p.domain}
                </div>
                
                <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--muted)", flex: 1, marginTop: "8px" }}>
                    {p.description}
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "14px" }}>
                    {p.stack.slice(0, 4).map(s => (
                        <span key={s} style={{
                            fontSize: "10px",
                            border: "1px solid var(--line, #333)",
                            padding: "2px 6px",
                            color: "var(--faint, #666)",
                            fontFamily: "monospace",
                            borderRadius: "4px"
                        }}>
                            {s}
                        </span>
                    ))}
                    {p.stack.length > 4 && <span style={{ fontSize: "10px", padding: "2px 6px", color: "#666" }}>+{p.stack.length - 4}</span>}
                </div>
            </motion.div>
        </Link>
    );
}

export default function Home() {
    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "60px", textAlign: "center" }}
            >
                <h1 style={{ 
                    fontSize: "clamp(32px, 5vw, 64px)", 
                    margin: "0 0 20px 0", 
                    background: "linear-gradient(to right, #fff, #a29bfe)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "monospace",
                    letterSpacing: "-2px"
                }}>
                    JIMBO // MAGNET
                </h1>
                <p style={{ color: "var(--muted)", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
                    Public AI Index & Documentation Hub for the JIMBO77 Ecosystem.
                    <br />
                    <span style={{ fontSize: "12px", color: "var(--faint)", fontFamily: "monospace", display: "block", marginTop: "10px" }}>
                        SYSTEM_STATUS: ONLINE // AGENTS: LISTENING
                    </span>
                </p>
                <div style={{ marginTop: "20px" }}>
                    <a href="/llms.txt" style={{ fontSize: "12px", color: "#a29bfe", textDecoration: "none", border: "1px solid #a29bfe", padding: "4px 12px", borderRadius: "100px" }}>
                        View llms.txt
                    </a>
                </div>
            </motion.header>

            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
                gap: "20px" 
            }}>
                {PROJECTS.map(p => (
                    <ProjectCard key={p.id} p={p} />
                ))}
            </div>
        </div>
    );
}
