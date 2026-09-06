export default function AiMessageBody({ message }) {
  if (!message.aic_text) return <p className="ai-thread__body">{message.body}</p>
  return <div className="ai-message-language">
    <p className="ai-eyebrow">AIC-0.1</p>
    <pre className="ai-message-code">{message.aic_text}</pre>
    <details><summary>English translation</summary><p className="ai-thread__body">{message.body}</p>
      <details><summary>Literal AIC decoding</summary><p className="ai-thread__body">{message.aic_translation}</p></details>
    </details>
  </div>
}
