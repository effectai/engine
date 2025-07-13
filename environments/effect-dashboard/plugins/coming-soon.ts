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

      // Ensure the parent can contain absolutely positioned children
      el.style.position = "relative";
      el.style.overflow = "hidden";

      // Style the overlay
      Object.assign(overlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "10",
        pointerEvents: "auto", // prevent clicks from passing through
      });

      el.style.filter = "grayscale(100%) contrast(80%) blur(0px)";

      // Inject some global styles (optional, better in CSS file)
      const styleTag = document.createElement("style");
      styleTag.textContent = `
        .coming-soon-button {
          background: linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%);
          color: white;
          border: 2px solid white;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: not-allowed;
          box-shadow: 0 0 12px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .coming-soon-button:hover {
          transform: scale(1.02);
        }

        .coming-soon-content {
          text-align: center;
        }
      `;
      document.head.appendChild(styleTag);

      el.appendChild(overlay);
    },
  });
});
