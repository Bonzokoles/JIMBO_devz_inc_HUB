import React from "react";

export function EastwoodView() {
  const [agents] = React.useState([
    {
      id: "retention-agent",
      name: "Retention Agent",
      kb: "bucket_blood_kb",
      status: "idle",
      description: "Customer retention & engagement analysis",
    },
    {
      id: "idea-agent",
      name: "Idea Agent",
      kb: "money_machine_kb",
      status: "idle",
      description: "Business idea generation & validation",
    },
    {
      id: "shadow-agent",
      name: "Shadow Agent",
      kb: "shadow_boxing_kb",
      status: "idle",
      description: "Competitive intelligence & market analysis",
    },
    {
      id: "trend-agent",
      name: "Trend Agent",
      kb: "the_now_kb",
      status: "idle",
      description: "Real-time trend detection & reporting",
    },
  ]);

  const [moneyMachine] = React.useState([
    { name: "Affiliate Marketing", path: "affiliate-marketing", ideas: 5 },
    { name: "AI Content Creation", path: "ai-content-creation", ideas: 8 },
    { name: "AI Monetization", path: "ai-monetization", ideas: 12 },
    { name: "Cloudflare Workers", path: "cloudflare-workers", ideas: 6 },
    { name: "Digital Products", path: "digital-products", ideas: 10 },
    { name: "E-commerce", path: "ecommerce", ideas: 7 },
    { name: "Payment Systems", path: "payment-systems", ideas: 4 },
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EASTWOOD DEVZ</h1>
          <p className="text-muted-foreground">
            AI Agents & Money Machine Knowledge Base
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Run All Agents
          </button>
        </div>
      </div>

      {/* AI Agents Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">🤖 AI Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{agent.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    agent.status === "active"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {agent.description}
              </p>
              <div className="text-xs text-muted-foreground mb-3">
                KB: {agent.kb}
              </div>
              <button className="w-full px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-sm">
                Run Agent
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Money Machine Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">💰 Money Machine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {moneyMachine.map((category) => (
            <div
              key={category.path}
              className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-semibold mb-2">{category.name}</h3>
              <div className="text-sm text-muted-foreground">
                {category.ideas} ideas
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Agents</div>
          <div className="text-2xl font-bold">{agents.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            Money Machine Categories
          </div>
          <div className="text-2xl font-bold">{moneyMachine.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            Total Business Ideas
          </div>
          <div className="text-2xl font-bold">
            {moneyMachine.reduce((sum, cat) => sum + cat.ideas, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
