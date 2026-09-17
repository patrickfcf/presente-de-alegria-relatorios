export interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
let pending: InstallEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  pending = e as InstallEvent;
  window.dispatchEvent(new Event("pda-install-ready"));
});
window.addEventListener("appinstalled", () => {
  pending = null;
});
export const getInstallPrompt = () => pending;
export const clearInstallPrompt = () => {
  pending = null;
};
