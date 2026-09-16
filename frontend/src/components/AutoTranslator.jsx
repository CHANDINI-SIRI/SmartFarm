import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const TARGET_LANGUAGES = {
  te: 'te',
  hi: 'hi'
};

const CACHE_KEY =
  'smartfarm_translation_cache_v1';

const ORIGINAL_ATTR =
  'data-sf-original';

function getCache() {
  try {
    return JSON.parse(
      localStorage.getItem(CACHE_KEY) || '{}'
    );
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch {
    // Ignore localStorage errors.
  }
}

function shouldSkip(node) {
  const parent = node.parentElement;

  if (!parent) {
    return true;
  }

  if (
    parent.closest(
      '[data-no-translate="true"]'
    )
  ) {
    return true;
  }

  if (
    parent.closest(
      'script, style, code, pre, textarea'
    )
  ) {
    return true;
  }

  return false;
}

function getTextNodes(root) {
  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

  const nodes = [];

  let current;

  while (
    (current = walker.nextNode())
  ) {
    const text =
      current.nodeValue?.trim();

    if (!text) {
      continue;
    }

    if (shouldSkip(current)) {
      continue;
    }

    nodes.push(current);
  }

  return nodes;
}

async function translateText(
  text,
  target
) {
  const cache = getCache();

  const cacheKey =
    `${target}::${text}`;

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const url =
      'https://api.mymemory.translated.net/get' +
      `?q=${encodeURIComponent(text)}` +
      `&langpair=en|${target}`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Translation request failed: ${response.status}`
      );
    }

    const data =
      await response.json();

    const translated =
      data?.responseData?.translatedText;

    if (
      !translated ||
      translated === text
    ) {
      return text;
    }

    cache[cacheKey] = translated;
    saveCache(cache);

    return translated;
  } catch (error) {
    console.warn(
      'Translation failed:',
      text,
      error
    );

    return text;
  }
}

async function translatePage(target) {
  const nodes =
    getTextNodes(document.body);

  for (
    const node of nodes
  ) {
    if (!node.parentElement) {
      continue;
    }

    const element =
      node.parentElement;

    if (
      element.dataset.sfTranslating ===
      'true'
    ) {
      continue;
    }

    const original =
      node.nodeValue.trim();

    if (!original) {
      continue;
    }

    /*
     * Store original English text only once.
     */
    if (
      !element.hasAttribute(
        ORIGINAL_ATTR
      )
    ) {
      element.setAttribute(
        ORIGINAL_ATTR,
        original
      );
    }

    element.dataset.sfTranslating =
      'true';

    const translated =
      await translateText(
        original,
        target
      );

    if (
      node.parentElement
    ) {
      node.nodeValue =
        translated;

      delete element.dataset
        .sfTranslating;
    }
  }
}

function restoreEnglish() {
  const elements =
    document.querySelectorAll(
      `[${ORIGINAL_ATTR}]`
    );

  elements.forEach(
    (element) => {
      const original =
        element.getAttribute(
          ORIGINAL_ATTR
        );

      if (!original) {
        return;
      }

      const textNode =
        Array.from(
          element.childNodes
        ).find(
          (node) =>
            node.nodeType ===
            Node.TEXT_NODE
        );

      if (textNode) {
        textNode.nodeValue =
          original;
      }

      element.removeAttribute(
        ORIGINAL_ATTR
      );
    }
  );
}

export default function AutoTranslator() {
  const { lang } = useApp();

  const running =
    useRef(false);

  /*
   * Handle language changes.
   */
  useEffect(() => {
    if (
      lang === 'en'
    ) {
      restoreEnglish();
      return;
    }

    const target =
      TARGET_LANGUAGES[lang];

    if (!target) {
      return;
    }

    if (running.current) {
      return;
    }

    running.current = true;

    translatePage(target)
      .finally(() => {
        running.current = false;
      });
  }, [lang]);

  /*
   * Watch for React-rendered content
   * appearing after the initial translation.
   */
  useEffect(() => {
    if (
      lang === 'en'
    ) {
      return;
    }

    const target =
      TARGET_LANGUAGES[lang];

    if (!target) {
      return;
    }

    let timer = null;

    const observer =
      new MutationObserver(() => {
        clearTimeout(timer);

        timer = setTimeout(() => {
          if (
            running.current
          ) {
            return;
          }

          running.current = true;

          translatePage(target)
            .finally(() => {
              running.current = false;
            });
        }, 500);
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [lang]);

  return null;
}