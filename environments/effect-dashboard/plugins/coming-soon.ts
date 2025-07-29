export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.directive("coming-soon", {
    mounted: (el) => {
      const overlay = document.createElement("div");
      overlay.className = "coming-soon-overlay";

      overlay.innerHTML = `
    <div class="coming-soon-content">
      <button class="coming-soon-button">🚧 Coming Soon 🚧</button>
    </div>
  `;

      el.style.position = "relative";
      el.style.overflow = "hidden";

      Object.assign(overlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "10",
        pointerEvents: "auto",
      });

      const isDark = document.documentElement.classList.contains("dark");

      overlay.style.backgroundColor = isDark
        ? "rgba(0, 0, 0, 0.4)"
        : "rgba(255, 255, 255, 0.4)";

      el.style.filter = "grayscale(100%) contrast(80%) blur(0px)";

      overlay
        .querySelector(".coming-soon-button")
        ?.classList.add(
          "bg-gradient-to-br",
          "from-pink-500",
          "to-indigo-500",
          "text-white",
          "border",
          "border-white/60",
          "rounded-xl",
          "px-6",
          "py-3",
          "text-base",
          "font-semibold",
          "shadow-md",
          "cursor-not-allowed",
          "transition",
          "hover:scale-105",
          "transform",
        );

      overlay
        .querySelector(".coming-soon-content")
        ?.classList.add("text-center");

      el.appendChild(overlay);
    },
  });
});
