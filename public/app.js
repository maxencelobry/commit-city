const state = { theme: "night", color: "lime", view: "full", username: "maxencelobry" };
const preview = document.querySelector("#preview");
const share = document.querySelector("#share");
const shareCode = document.querySelector("#share-url");
const markdown = document.querySelector("#markdown");
const status = document.querySelector("#status");
const debugOutput = document.querySelector("#debug-output");

const siteThemes = [
  { name: "lime", color: "#c6f432" },
  { name: "blue", color: "#54a8ff" },
  { name: "purple", color: "#b57bff" },
  { name: "orange", color: "#ff9542" },
  { name: "cyan", color: "#3fe0da" },
];
const siteTheme = siteThemes[Math.floor(Math.random() * siteThemes.length)];
document.documentElement.dataset.siteTheme = siteTheme.name;
document.documentElement.style.setProperty("--site-accent", siteTheme.color);

const appBase = new URL(".", window.location.href);

function cityUrl(fresh = false) {
  const query = new URLSearchParams({ theme: state.theme, color: state.color, view: state.view });
  if (fresh) query.set("refresh", Date.now());
  const url = new URL("api/city/" + encodeURIComponent(state.username) + ".svg?" + query, appBase);
  return url.pathname + url.search;
}

function render() {
  if (!state.username) { preview.removeAttribute("src"); share.hidden = true; status.textContent = "Enter a username to start"; debugOutput.textContent = "Waiting for a GitHub username."; return; }
  const sharePath = cityUrl();
  const previewPath = cityUrl(true);
  status.textContent = "Loading…";
  status.dataset.state = "loading";
  preview.src = previewPath;
  shareCode.textContent = new URL(sharePath, window.location.origin).href;
  document.querySelector("#download").href = sharePath;
  markdown.textContent = "[![Commit City for @" + state.username + "](" + shareCode.textContent + ")](" + appBase.href + ")";
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
