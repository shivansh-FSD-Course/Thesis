/* =========================
   CONFIG (edit as needed)
========================= */

const STUDY_VERSION = "0.1.0";
const COMPLETION_CODE = "C1AB23"; // replace with your Prolific completion code later
const MIN_USER_MESSAGES_PER_TASK = 4;
const MAX_CHARS_PER_MESSAGE = 800;

// GitHub Pages ONLY: keep null for placeholder replies.
// Later, set this to your own backend endpoint.
const MODEL_API_URL = null;

// Tasks baked into the site (5 tasks)
const TASKS = [
  {
    id: "T1_self_style",
    title: "Task 1 — Self-description",
    prompt:
      "In 4–6 sentences, describe how you typically communicate with people (e.g., direct vs careful, formal vs casual). " +
      "Then ask the AI for advice on how to communicate more effectively in situations that matter to you.\n\n" +
      "Avoid sensitive personal details."
  },
  {
    id: "T2_recent_stress",
    title: "Task 2 — A stressful situation",
    prompt:
      "Describe a situation you are currently dealing with that feels stressful or uncertain (work/study/life is fine). " +
      "Explain what you want to happen. Then ask the AI for help.\n\n" +
      "Avoid sensitive personal details."
  },
  {
    id: "T3_misunderstood",
    title: "Task 3 — Feeling misunderstood",
    prompt:
      "Describe a time you felt misunderstood in a conversation. " +
      "What do you think the other person missed? What would you want them to understand? " +
      "Ask the AI to help you express your point more clearly.\n\n" +
      "Avoid sensitive personal details."
  },
  {
    id: "T4_goal_followthrough",
    title: "Task 4 — Goal + follow-through",
    prompt:
      "Pick a small goal you want to follow through on in the next 2–4 weeks. " +
      "Explain what usually gets in the way. Ask the AI to help you make a realistic plan.\n\n" +
      "Avoid sensitive personal details."
  },
  {
    id: "T5_boundary",
    title: "Task 5 — Setting a boundary",
    prompt:
      "Describe a scenario where you need to set a boundary (with a friend, classmate, teammate, etc.). " +
      "Explain what boundary you want and why. Ask the AI to help you phrase it.\n\n" +
      "Avoid sensitive personal details."
  }
];

// Post-task survey (7-point Likert, 1–7)
const POST_TASK_ITEMS = [
  // Felt understanding
  { id: "fu_1", group: "Felt understanding", text: "The AI understood what I meant." },
  { id: "fu_2", group: "Felt understanding", text: "The AI understood my main goal in this task." },
  { id: "fu_3", group: "Felt understanding", text: "The AI addressed the parts of my message that mattered most." },
  { id: "fu_4", group: "Felt understanding", text: "I did not need to repeat myself for the AI to get it." },

  // Emotional attunement
  { id: "ea_1", group: "Emotional attunement", text: "The AI noticed how I was feeling." },
  { id: "ea_2", group: "Emotional attunement", text: "The AI’s tone matched my situation." },
  { id: "ea_3", group: "Emotional attunement", text: "The AI responded in a supportive way." },
  { id: "ea_4", group: "Emotional attunement", text: "The AI treated my feelings as reasonable and taken seriously." },

  // Personalization
  { id: "pp_1", group: "Personalization", text: "The AI’s response felt tailored to me." },
  { id: "pp_2", group: "Personalization", text: "The AI used details I shared (not just generic advice)." },
  { id: "pp_3", group: "Personalization", text: "The AI adapted well when I clarified or corrected something." },

  // Trust / comfort
  { id: "tc_1", group: "Trust & comfort", text: "I would rely on this AI in a similar situation." },
  { id: "tc_2", group: "Trust & comfort", text: "I felt comfortable continuing the conversation with this AI." },

  // Effort
  { id: "ef_1", group: "Effort", text: "I had to spend effort checking or correcting what the AI said." },
  { id: "ef_2", group: "Effort", text: "Using this AI reduced my mental effort for this task." }
];

// Self-labels
const SELF_LABEL_ITEMS = [
  { id: "tone", text: "My overall emotional tone in this conversation was:", type: "select", options: ["Positive", "Neutral", "Negative"] },
  { id: "personalness", text: "How personal was what you shared?", type: "select", options: ["None", "Low", "Medium", "High"] },
  { id: "style", text: "Your writing style was mostly:", type: "select", options: ["Casual", "Neutral", "Formal"] },
  { id: "ontopic", text: "You stayed on the task:", type: "select", options: ["Mostly on-topic", "Mixed", "Mostly off-topic"] },
  { id: "engagement", text: "How engaged were you in this task?", type: "likert7" }
];

// End-of-study items
const END_ITEMS = [
  { id: "global_fu", text: "Overall, I felt understood by the AI across the study.", type: "likert7" },
  { id: "global_ea", text: "Overall, the AI felt emotionally attuned to me.", type: "likert7" },
  { id: "global_pp", text: "Overall, the AI felt personalized to me.", type: "likert7" },
  { id: "most_understood", text: "Which task felt most understood?", type: "select", options: TASKS.map(t => t.title) },
  { id: "least_understood", text: "Which task felt least understood?", type: "select", options: TASKS.map(t => t.title) },
  { id: "open_why", text: "What did the AI do that most made you feel understood (or not understood)?", type: "text" },
  { id: "open_change", text: "If you could change one thing about the AI’s behavior, what would it be?", type: "text" }
];

/* =========================
   STATE
========================= */

const state = {
  step: 1,
  taskIndex: 0,
  participant: { prolific_pid: "", study_id: "", session_id: "" },
  session: { id: randId("sess"), startedAt: new Date().toISOString(), version: STUDY_VERSION },
  tasks: TASKS.map(t => ({ ...t, chat: [], postSurvey: {}, selfLabels: {} })),
  endSurvey: {},
  ui: { busy: false, error: "" }
};

/* =========================
   HELPERS
========================= */

function $(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function randId(prefix) {
  const x = Math.random().toString(16).slice(2);
  const y = Date.now().toString(16);
  return `${prefix}_${y}_${x}`;
}

function qsParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function setProgress(text) { $("progressText").textContent = text; }

function setPidPill() {
  const pid = state.participant.prolific_pid || "—";
  $("pidPill").textContent = `PID: ${pid.slice(0, 12)}${pid.length > 12 ? "…" : ""}`;
}

function nowIso() { return new Date().toISOString(); }

/* =========================
   MODEL REPLY (placeholder)
========================= */

async function getAssistantReply(messages) {
  if (MODEL_API_URL) {
    const res = await fetch(MODEL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error(`Model API error: ${res.status}`);
    const data = await res.json();
    return data.reply;
  }

  const lastUser = [...messages].reverse().find(m => m.role === "user");
  const userText = lastUser ? lastUser.content : "";
  return (
    "Thanks — I think I understand. Here’s what I’m taking from your message:\n" +
    `• Main point: ${userText.slice(0, 120)}${userText.length > 120 ? "…" : ""}\n\n` +
    "To help, I’ll ask one clarifying question:\n" +
    "What outcome would feel like a good result for you in this situation?"
  );
}

/* =========================
   RENDER
========================= */

function render() {
  setPidPill();
  const app = $("app");
  app.innerHTML = "";

  if (state.ui.error) {
    app.appendChild(elCard(`<div class="small" style="color:var(--danger)">Error: ${escapeHtml(state.ui.error)}</div>`));
  }

  if (state.step === 1) return renderConsent(app);
  if (state.step === 2) return renderParticipantInfo(app);
  if (state.step === 3) return renderInstructions(app);
  if (state.step === 4) return renderTask(app);
  if (state.step === 5) return renderEndSurvey(app);
  if (state.step === 6) return renderDone(app);
}

function elCard(innerHtml) {
  const d = document.createElement("div");
  d.className = "card";
  d.innerHTML = innerHtml;
  return d;
}

function renderConsent(app) {
  setProgress("Step 1 of 6 — Consent");
  const card = elCard(`
    <h2>Consent</h2>
    <p class="muted">Please read and confirm to continue.</p>
    <div class="hr"></div>
    <div class="small">
      <p><b>What you will do:</b> complete 5 short conversation tasks with an AI and answer brief surveys.</p>
      <p><b>Data collected:</b> your chat messages, timestamps, and your survey responses. No server storage is enabled in this build.</p>
      <p><b>Risks:</b> minimal. Please avoid sharing sensitive personal information.</p>
      <p><b>Voluntary:</b> you can stop at any time.</p>
    </div>
    <label><input type="checkbox" id="consent1" /> I am 18+ and I consent to participate.</label>
    <label><input type="checkbox" id="consent2" /> I understand my messages will be recorded for research purposes.</label>
    <div class="btnRow"><button class="primary" id="btnConsentNext" disabled>Continue</button></div>
  `);
  app.appendChild(card);

  const c1 = $("consent1");
  const c2 = $("consent2");
  const btn = $("btnConsentNext");
  function upd() { btn.disabled = !(c1.checked && c2.checked); }
  c1.addEventListener("change", upd);
  c2.addEventListener("change", upd);

  btn.addEventListener("click", () => { state.step = 2; render(); });
}

function renderParticipantInfo(app) {
  setProgress("Step 2 of 6 — Participant info");

  const pid = qsParam("PROLIFIC_PID");
  const sid = qsParam("STUDY_ID");
  const sess = qsParam("SESSION_ID");
  if (!state.participant.prolific_pid && pid) state.participant.prolific_pid = pid;
  if (!state.participant.study_id && sid) state.participant.study_id = sid;
  if (!state.participant.session_id && sess) state.participant.session_id = sess;

  const card = elCard(`
    <h2>Participant info</h2>
    <p class="muted">If you came from Prolific, this may auto-fill.</p>
    <div class="row">
      <div class="col">
        <label>PROLIFIC_PID</label>
        <input type="text" id="pidInput" placeholder="e.g., 5e8f..." value="${escapeHtml(state.participant.prolific_pid)}" />
      </div>
      <div class="col">
        <label>STUDY_ID (optional)</label>
        <input type="text" id="studyInput" value="${escapeHtml(state.participant.study_id)}" />
      </div>
      <div class="col">
        <label>SESSION_ID (optional)</label>
        <input type="text" id="sessionInput" value="${escapeHtml(state.participant.session_id)}" />
      </div>
    </div>
    <div class="hr"></div>
    <div class="btnRow">
      <button id="btnBack">Back</button>
      <button class="primary" id="btnInfoNext">Continue</button>
    </div>
  `);
  app.appendChild(card);

  $("btnBack").addEventListener("click", () => { state.step = 1; render(); });
  $("btnInfoNext").addEventListener("click", () => {
    state.participant.prolific_pid = $("pidInput").value.trim();
    state.participant.study_id = $("studyInput").value.trim();
    state.participant.session_id = $("sessionInput").value.trim();
    state.session.participantProvidedAt = nowIso();
    state.step = 3;
    render();
  });
}

function renderInstructions(app) {
  setProgress("Step 3 of 6 — Instructions");
  const card = elCard(`
    <h2>Instructions</h2>
    <div class="small">
      <ul>
        <li>You will complete <b>${TASKS.length}</b> tasks.</li>
        <li>For each task, you will exchange at least <b>${MIN_USER_MESSAGES_PER_TASK}</b> messages as the user.</li>
        <li>After each task, you will answer a short survey.</li>
        <li>Please avoid sensitive personal information.</li>
      </ul>
    </div>
    <div class="hr"></div>
    <div class="btnRow">
      <button id="btnBack">Back</button>
      <button class="primary" id="btnStart">Start Task 1</button>
    </div>
  `);
  app.appendChild(card);

  $("btnBack").addEventListener("click", () => { state.step = 2; render(); });
  $("btnStart").addEventListener("click", () => { state.step = 4; state.taskIndex = 0; render(); });
}

function renderTask(app) {
  const t = state.tasks[state.taskIndex];
  setProgress(`Step 4 of 6 — Tasks (${state.taskIndex + 1}/${state.tasks.length})`);

  const userMsgCount = t.chat.filter(m => m.role === "user").length;

  const card = elCard(`
    <h2>${escapeHtml(t.title)}</h2>
    <div class="small">${escapeHtml(t.prompt)}</div>

    <div class="hr"></div>

    <div class="chatBox">
      <div class="chatLog" id="chatLog"></div>
      <div class="chatInput">
        <textarea id="chatInput" placeholder="Type your message…"></textarea>
        <button class="primary" id="sendBtn">Send</button>
      </div>
    </div>

    <div class="small" style="margin-top:8px">
      Messages you’ve sent in this task: <b id="msgCount">${userMsgCount}</b> / ${MIN_USER_MESSAGES_PER_TASK}
      <span class="mutedSmall"> (Tip: press Cmd/Ctrl+Enter to send)</span>
    </div>

    <div class="btnRow">
      <button id="btnPrev" ${state.taskIndex === 0 ? "disabled" : ""}>Previous task</button>
      <button class="danger" id="btnReset">Reset this task</button>
      <button class="primary" id="btnFinishTask" ${userMsgCount < MIN_USER_MESSAGES_PER_TASK ? "disabled" : ""}>
        Finish task & survey
      </button>
    </div>
  `);

  app.appendChild(card);

  const log = $("chatLog");
  log.innerHTML = t.chat.map(m => {
    const cls = m.role === "user" ? "msg user" : "msg assistant";
    return `<div class="${cls}"><div class="bubble">${escapeHtml(m.text)}</div></div>`;
  }).join("");
  log.scrollTop = log.scrollHeight;

  const input = $("chatInput");
  const sendBtn = $("sendBtn");

  sendBtn.addEventListener("click", async () => {
    state.ui.error = "";
    const text = input.value.trim();
    if (!text) return;
    if (text.length > MAX_CHARS_PER_MESSAGE) {
      state.ui.error = `Message too long (max ${MAX_CHARS_PER_MESSAGE} chars).`;
      return render();
    }

    t.chat.push({ id: randId("m"), role: "user", text, ts: nowIso() });
    input.value = "";
    render();

    try {
      state.ui.busy = true;
      const messagesForModel = [
        { role: "system", content: "You are a helpful assistant. Be concise, kind, and ask at most one clarifying question when needed." },
        ...t.chat.map(m => ({ role: m.role, content: m.text }))
      ];
      const reply = await getAssistantReply(messagesForModel);
      t.chat.push({ id: randId("m"), role: "assistant", text: reply, ts: nowIso() });
    } catch (e) {
      state.ui.error = e.message || String(e);
    } finally {
      state.ui.busy = false;
      render();
    }
  });

  input.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sendBtn.click();
  });

  $("btnReset").addEventListener("click", () => {
    if (!confirm("Reset this task chat? This will delete messages for this task.")) return;
    t.chat = [];
    t.postSurvey = {};
    t.selfLabels = {};
    render();
  });

  $("btnPrev").addEventListener("click", () => {
    if (state.taskIndex === 0) return;
    state.taskIndex -= 1;
    render();
  });

  $("btnFinishTask").addEventListener("click", () => renderPostTaskSurvey(t));
}

function renderPostTaskSurvey(t) {
  setProgress(`Step 4 of 6 — Task survey (${state.taskIndex + 1}/${state.tasks.length})`);
  const appEl = $("app");
  appEl.innerHTML = "";

  const card = elCard(`
    <h2>Survey — ${escapeHtml(t.title)}</h2>
    <p class="muted">Please answer based on this task only.</p>
    <div class="hr"></div>

    <h3 style="margin:0 0 8px">Part 1 — Ratings (1–7)</h3>
    <div id="likertBlock" class="scaleRow"></div>

    <div class="hr"></div>

    <h3 style="margin:0 0 8px">Part 2 — Self-labels</h3>
    <div id="selfLabelBlock" class="scaleRow"></div>

    <div class="btnRow">
      <button id="btnBackToChat">Back to chat</button>
      <button class="primary" id="btnSurveyNext">Continue</button>
    </div>
  `);
  appEl.appendChild(card);

  const likertBlock = $("likertBlock");
  POST_TASK_ITEMS.forEach(item => {
    const key = item.id;
    const current = t.postSurvey[key] ?? "";
    const html = `
      <div class="scaleItem">
        <div class="small muted">${escapeHtml(item.group)}</div>
        <div class="q">${escapeHtml(item.text)}</div>
        <div class="likert">
          ${[1,2,3,4,5,6,7].map(v => {
            const id = `${t.id}_${key}_${v}`;
            return `
              <div>
                <input type="radio" name="${t.id}_${key}" id="${id}" value="${v}" ${String(current) === String(v) ? "checked" : ""}>
                <label for="${id}">${v}</label>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    likertBlock.insertAdjacentHTML("beforeend", html);
  });

  const selfBlock = $("selfLabelBlock");
  SELF_LABEL_ITEMS.forEach(item => {
    const key = item.id;
    const current = t.selfLabels[key] ?? "";

    if (item.type === "select") {
      const html = `
        <div class="scaleItem">
          <div class="q">${escapeHtml(item.text)}</div>
          <select id="${t.id}_self_${key}">
            <option value="" disabled ${current ? "" : "selected"}>Select…</option>
            ${item.options.map(opt => `
              <option value="${escapeHtml(opt)}" ${current === opt ? "selected" : ""}>${escapeHtml(opt)}</option>
            `).join("")}
          </select>
        </div>
      `;
      selfBlock.insertAdjacentHTML("beforeend", html);
    } else if (item.type === "likert7") {
      const html = `
        <div class="scaleItem">
          <div class="q">${escapeHtml(item.text)}</div>
          <div class="likert">
            ${[1,2,3,4,5,6,7].map(v => {
              const id = `${t.id}_self_${key}_${v}`;
              return `
                <div>
                  <input type="radio" name="${t.id}_self_${key}" id="${id}" value="${v}" ${String(current) === String(v) ? "checked" : ""}>
                  <label for="${id}">${v}</label>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
      selfBlock.insertAdjacentHTML("beforeend", html);
    }
  });

  $("btnBackToChat").addEventListener("click", () => { state.step = 4; render(); });

  $("btnSurveyNext").addEventListener("click", () => {
    POST_TASK_ITEMS.forEach(item => {
      const name = `${t.id}_${item.id}`;
      const chosen = document.querySelector(`input[name="${name}"]:checked`);
      if (chosen) t.postSurvey[item.id] = Number(chosen.value);
    });

    SELF_LABEL_ITEMS.forEach(item => {
      if (item.type === "select") {
        const v = document.getElementById(`${t.id}_self_${item.id}`).value;
        if (v) t.selfLabels[item.id] = v;
      } else if (item.type === "likert7") {
        const name = `${t.id}_self_${item.id}`;
        const chosen = document.querySelector(`input[name="${name}"]:checked`);
        if (chosen) t.selfLabels[item.id] = Number(chosen.value);
      }
    });

    const missing = POST_TASK_ITEMS.filter(it => t.postSurvey[it.id] == null);
    const missingSelf = SELF_LABEL_ITEMS.filter(it => t.selfLabels[it.id] == null);

    if (missing.length > 0 || missingSelf.length > 0) {
      alert("Please answer all survey questions before continuing.");
      return;
    }

    if (state.taskIndex < state.tasks.length - 1) {
      state.taskIndex += 1;
      state.step = 4;
      render();
    } else {
      state.step = 5;
      render();
    }
  });
}

function renderEndSurvey(app) {
  setProgress("Step 5 of 6 — Final survey");
  const card = elCard(`
    <h2>Final survey</h2>
    <p class="muted">These questions refer to the whole study.</p>
    <div id="endBlock" class="scaleRow"></div>
    <div class="btnRow">
      <button id="btnBack">Back</button>
      <button class="primary" id="btnFinish">Finish</button>
    </div>
  `);
  app.appendChild(card);

  const endBlock = $("endBlock");
  END_ITEMS.forEach(item => {
    const current = state.endSurvey[item.id] ?? "";

    if (item.type === "likert7") {
      endBlock.insertAdjacentHTML("beforeend", `
        <div class="scaleItem">
          <div class="q">${escapeHtml(item.text)}</div>
          <div class="likert">
            ${[1,2,3,4,5,6,7].map(v => {
              const id = `end_${item.id}_${v}`;
              return `
                <div>
                  <input type="radio" name="end_${item.id}" id="${id}" value="${v}" ${String(current) === String(v) ? "checked" : ""}>
                  <label for="${id}">${v}</label>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `);
    } else if (item.type === "select") {
      endBlock.insertAdjacentHTML("beforeend", `
        <div class="scaleItem">
          <div class="q">${escapeHtml(item.text)}</div>
          <select id="end_${item.id}">
            <option value="" disabled ${current ? "" : "selected"}>Select…</option>
            ${item.options.map(opt => `
              <option value="${escapeHtml(opt)}" ${current === opt ? "selected" : ""}>${escapeHtml(opt)}</option>
            `).join("")}
          </select>
        </div>
      `);
    } else if (item.type === "text") {
      endBlock.insertAdjacentHTML("beforeend", `
        <div class="scaleItem">
          <div class="q">${escapeHtml(item.text)}</div>
          <textarea id="end_${item.id}" placeholder="Type your answer…">${escapeHtml(current)}</textarea>
        </div>
      `);
    }
  });

  $("btnBack").addEventListener("click", () => { state.step = 4; state.taskIndex = state.tasks.length - 1; render(); });

  $("btnFinish").addEventListener("click", () => {
    END_ITEMS.forEach(item => {
      if (item.type === "likert7") {
        const chosen = document.querySelector(`input[name="end_${item.id}"]:checked`);
        if (chosen) state.endSurvey[item.id] = Number(chosen.value);
      } else if (item.type === "select") {
        const v = document.getElementById(`end_${item.id}`).value;
        if (v) state.endSurvey[item.id] = v;
      } else if (item.type === "text") {
        state.endSurvey[item.id] = document.getElementById(`end_${item.id}`).value.trim();
      }
    });

    const required = END_ITEMS.filter(it => it.type !== "text");
    const missing = required.filter(it => state.endSurvey[it.id] == null || state.endSurvey[it.id] === "");
    if (missing.length > 0) {
      alert("Please answer all required questions before finishing.");
      return;
    }

    state.session.completedAt = nowIso();
    state.step = 6;
    render();
  });
}

function renderDone(app) {
  setProgress("Step 6 of 6 — Complete");
  const payload = buildExportPayload();

  const card = elCard(`
    <h2>Complete</h2>
    <p class="muted">Please submit this completion code on Prolific:</p>

    <div class="card" style="background:rgba(77,163,255,0.10);border-color:rgba(77,163,255,0.35)">
      <div style="font-size:28px;font-weight:700;letter-spacing:1px">${COMPLETION_CODE}</div>
      <div class="small muted">Replace it in <code>app.js</code> for your real Prolific study.</div>
    </div>

    <div class="hr"></div>

    <h3 style="margin:0 0 8px">Download your session data</h3>
    <p class="small muted">Server storage is disabled, so use this download for testing.</p>

    <div class="btnRow">
      <button class="primary" id="btnDownloadJson">Download JSON</button>
      <button id="btnCopyJson">Copy JSON</button>
      <button class="danger" id="btnResetAll">Reset</button>
    </div>
  `);
  app.appendChild(card);

  $("btnDownloadJson").addEventListener("click", () => downloadJson(payload));
  $("btnCopyJson").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(payload)); alert("Copied JSON to clipboard."); }
    catch { alert("Clipboard copy failed. Use Download JSON instead."); }
  });
  $("btnResetAll").addEventListener("click", () => { if (confirm("Reset everything?")) window.location.reload(); });
}

function buildExportPayload() {
  return {
    schema: "felt-understanding-study",
    version: state.session.version,
    session_id: state.session.id,
    started_at: state.session.startedAt,
    completed_at: state.session.completedAt || null,
    participant: {
      prolific_pid: state.participant.prolific_pid || null,
      study_id: state.participant.study_id || null,
      session_id: state.participant.session_id || null
    },
    tasks: state.tasks.map(t => ({
      id: t.id,
      title: t.title,
      prompt: t.prompt,
      chat: t.chat,
      postSurvey: t.postSurvey,
      selfLabels: t.selfLabels
    })),
    endSurvey: state.endSurvey
  };
}

function downloadJson(obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const pid = state.participant.prolific_pid ? state.participant.prolific_pid.slice(0,8) : "anon";
  a.href = url;
  a.download = `study_${pid}_${state.session.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =========================
   INIT
========================= */

function init() {
  const pid = qsParam("PROLIFIC_PID");
  const sid = qsParam("STUDY_ID");
  const sess = qsParam("SESSION_ID");
  if (pid) state.participant.prolific_pid = pid;
  if (sid) state.participant.study_id = sid;
  if (sess) state.participant.session_id = sess;
  render();
}

document.addEventListener("DOMContentLoaded", init);
