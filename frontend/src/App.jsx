import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Uses Render backend URL in production, or localhost during development
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setReply(data.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Gemini AI App</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="4"
          placeholder="Ask Gemini anything..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Send Prompt"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {reply && (
        <div className="response-box">
          <h3>Response:</h3>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
}

export default App;
