import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import { motion } from "framer-motion";

function SchemaMarkup({ project }: { project: any }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": project.name,
        "applicationCategory": project.type || "DeveloperApplication",
        "description": project.description,
        "url": `https://${project.domain}`,
        "author": {
            "@type": "Organization",
            "name": "JIMBO77 DEVZ INC",
            "url": "https://jimbo77.org"
        },
        "featureList": project.features || [],
        "programmingLanguage": project.stack[0],
        "operatingSystem": "Cloudflare Workers / Web"
    };

    return (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    );
}

export default function ProjectDetail() {
    const { id } = useParams();
    const project = PROJECTS.find(p => p.id === id);

    if (!project) {
        return <div style={{ padding: "40px", color: "red", textAlign: "center" }}>Project NOT_FOUND</div>;
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
            <SchemaMarkup project={project} />
            
            <Link to="/" style={{ color: "var(--muted)", textDecoration: "none", fontFamily: "monospace", display: "inline-block", marginBottom: "20px" }}>
                ← BACK_TO_HUB
            </Link>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <header style={{ marginBottom: "40px", borderBottom: "1px solid var(--line, #333)", paddingBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ 
                            background: project.role === "public" ? "#00C853" : "#666", 
                            color: "#000", 
                            padding: "2px 8px", 
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            fontFamily: "monospace"
                        }}>
                            {project.role.toUpperCase()}
                        </span>
                        <span style={{ color: "var(--faint, #666)", fontFamily: "monospace", fontSize: "14px" }}>
                           ID: {project.id}
                        </span>
                    </div>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: "48px", 
                        fontFamily: "monospace", 
                        letterSpacing: "-1px" 
                    }}>
                        {project.name}
                    </h1>
                    <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer" style={{ 
                        color: "#a29bfe", 
                        fontSize: "18px", 
                        marginTop: "10px", 
                        display: "inline-block",
                        textDecoration: "none"
                    }}>
                        {project.domain} ↗
                    </a>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
                    <main>
                        <section style={{ marginBottom: "40px" }}>
                            <h2 style={{ fontSize: "14px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Overview</h2>
                            <p style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--fg)" }}>
                                {project.description}
                            </p>
                        </section>

                        {project.features && (
                            <section style={{ marginBottom: "40px" }}>
                                <h2 style={{ fontSize: "14px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Key Features</h2>
                                <ul style={{ padding: 0, listStyle: "none" }}>
                                    {project.features.map(f => (
                                        <li key={f} style={{ 
                                            marginBottom: "10px", 
                                            padding: "10px 14px", 
                                            background: "rgba(255,255,255,0.03)", 
                                            borderLeft: "2px solid #a29bfe",
                                            color: "var(--fg)"
                                        }}>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {project.example_query && (
                            <section>
                                <h2 style={{ fontSize: "14px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Example AI Query</h2>
                                <pre style={{ 
                                    background: "#000", 
                                    padding: "20px", 
                                    borderRadius: "8px", 
                                    border: "1px solid #333", 
                                    overflowX: "auto",
                                    color: "#a29bfe",
                                    fontFamily: "monospace"
                                }}>
                                    <code>{project.example_query}</code>
                                </pre>
                            </section>
                        )}
                    </main>

                    <aside>
                        <div style={{ 
                            background: "rgba(255,255,255,0.02)", 
                            border: "1px solid var(--line, #333)", 
                            borderRadius: "12px", 
                            padding: "24px" 
                        }}>
                            <h3 style={{ marginTop: 0, fontSize: "14px", color: "var(--muted)" }}>Tech Stack</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                                {project.stack.map(s => (
                                    <span key={s} style={{ 
                                        padding: "4px 8px", 
                                        borderRadius: "4px", 
                                        background: "rgba(255,255,255,0.05)",
                                        fontSize: "12px",
                                        color: "var(--fg)" 
                                    }}>
                                        {s}
                                    </span>
                                ))}
                            </div>

                            <div style={{ marginTop: "30px" }}>
                                <h3 style={{ fontSize: "14px", color: "var(--muted)" }}>Resources</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                                    {project.docs && (
                                        <a href="#" style={{ color: "#fff", textDecoration: "none", fontSize: "14px" }}>📚 Documentation</a>
                                    )}
                                    {project.api_docs && (
                                        <a href={project.api_docs} style={{ color: "#fff", textDecoration: "none", fontSize: "14px" }}>🔌 API Reference</a>
                                    )}
                                    {project.repo && (
                                        <a href={project.repo} style={{ color: "#fff", textDecoration: "none", fontSize: "14px" }}>💻 Repository</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

            </motion.div>
        </div>
    );
}
