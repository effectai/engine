import { ref, onMounted, onBeforeUnmount } from "vue";

type Options = {
  speed?: number;
  backSpeed?: number;
  hold?: number;
  between?: number;
};

export function useTypewriter(phrases: string[], opts: Options = {}) {
  const { speed = 45, backSpeed = 28, hold = 1400, between = 400 } = opts;

  const text = ref("");
  const isClient = typeof window !== "undefined";

  const reduceMotion =
    isClient && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let i = 0;
  let j = 0;
  let deleting = false;
  let t: number | null = null;
  let caretTimer: number | null = null;
  const caretVisible = ref(true);

  const clearTimers = () => {
    if (t) window.clearTimeout(t);
    if (caretTimer) window.clearInterval(caretTimer);
  };

  onMounted(() => {
    if (!phrases.length) return;

    if (reduceMotion) {
      console.warn("Reduce motion is enabled, skipping typewriter effect.");
      text.value = phrases[0];
      return;
    }

    const tick = () => {
      const word = phrases[i % phrases.length];
      if (!deleting) {
        text.value = word.slice(0, j++);
        if (j <= word.length) {
          t = window.setTimeout(tick, speed);
        } else {
          deleting = true;
          t = window.setTimeout(tick, hold);
        }
      } else {
        if (j > 0) {
          j -= 1;
          text.value = word.slice(0, j);
          t = setTimeout(tick, backSpeed);
        } else {
          deleting = false;
          i += 1;
          t = setTimeout(tick, between);
        }
      }
    };

    tick();
    caretTimer = window.setInterval(() => {
      caretVisible.value = !caretVisible.value;
    }, 450);
  });

  onBeforeUnmount(clearTimers);

  return { text, caretVisible };
}
