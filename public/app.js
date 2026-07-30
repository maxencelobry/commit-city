const state = { theme: "night", color: "lime", view: "full", username: "octocat" };
const preview = document.querySelector("#preview");
const share = document.querySelector("#share");
const shareCode = document.querySelector("#share-url");
const markdown = document.querySelector("#markdown");
const status = document.querySelector("#status");
const debugOutput = document.querySelector("#debug-output");

function cityUrl(fresh = false) {
  const query = new URLSearchParams({ theme: state.theme, color: state.color, view: state.view });
  if (fresh) query.set("refresh", Date.now());
  return "/api/city/" + encodeURIComponent(state.username) + ".svg?" + query;
}

function render() {
  const sharePath = cityUrl();
  const previewPath = cityUrl(true);
  status.textContent = "Loading…";
  status.dataset.state = "loading";
  preview.src = previewPath;
  shareCode.textContent = new URL(sharePath, window.location.origin).href;
  document.querySelector("#download").href = sharePath;
  markdown.textContent = "[![Commit City for @" + state.username + "](" + shareCode.textContent + ")](" + window.location.origin + ")";
  share.hidden = false;
  debugOutput.textContent = "Requesting @" + state.username + " · theme=" + state.theme + " · color=" + state.color + " · view=" + state.view;
}

preview.addEventListener("load", () => {
  status.textContent = "SVG received";
  status.dataset.state = "success";
  debugOutput.textContent += " · response loaded successfully.";
});

preview.addEventListener("error", () => {
  status.textContent = "Image error";
  status.dataset.state = "error";
  debugOutput.textContent += " · the image could not load. Check the server terminal.";
});

document.querySelectorAll("[data-theme], [data-color], [data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.theme ? "theme" : button.dataset.color ? "color" : "view";
    state[group] = button.dataset[group];
    document.querySelectorAll("[data-" + group + "]").forEach((item) => item.classList.toggle("selected", item === button));
    render();
  });
});

document.querySelector("#generator").addEventListener("submit", (event) => {
  event.preventDefault();
  state.username = document.querySelector("#username").value.trim().replace(/^@/, "");
  render();
});

document.querySelector("#copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(shareCode.textContent);
  const button = document.querySelector("#copy");
  button.textContent = "Copied";
  setTimeout(() => (button.textContent = "Copy URL"), 1200);
});

document.querySelector("#copy-markdown").addEventListener("click", async () => {
  await navigator.clipboard.writeText(markdown.textContent);
  const button = document.querySelector("#copy-markdown");
  button.textContent = "Markdown copied";
  setTimeout(() => (button.textContent = "Copy Markdown"), 1200);
});

render();
