const BASE_PATH = "/";
// For a project path, for example: "/my-project/"

const SUPPORTED_LANGUAGES = new Set(["en", "de", "ru"]);

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";

  for (const item of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = item.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function getPreferredSupportedLanguage(header, fallback = "en") {
  const languages = header
    .split(",")
    .map((item, index) => {
      const parts = item.trim().toLowerCase().split(";");

      const language = parts[0];

      const qParameter = parts.find((part) =>
        part.trim().startsWith("q=")
      );

      const quality = qParameter
        ? Number(qParameter.trim().slice(2))
        : 1;

      return {
        language,
        quality: Number.isNaN(quality) ? 0 : quality,
        index,
      };
    })
    .filter(({ language, quality }) => {
      return language && language !== "*" && quality > 0;
    })
    .sort((a, b) => {
      // Higher q wins; original order breaks ties.
      return b.quality - a.quality || a.index - b.index;
    });

  for (const { language } of languages) {
    const primaryLanguage = language.split("-")[0];

    if (SUPPORTED_LANGUAGES.has(primaryLanguage)) {
      return primaryLanguage;
    }
  }

  return fallback;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);


  const basePath = BASE_PATH.endsWith("/")
    ? BASE_PATH
    : `${BASE_PATH}/`;

  const isRoot =
    url.pathname === basePath ||
    url.pathname === `${basePath}index.html`;

  // Do not redirect language pages or static assets.
  if (!isRoot) {
    return next();
  }

  const acceptLanguage =
    request.headers.get("Accept-Language") || "";


  // If a language cookie exists, do not perform automatic redirection.
  const languageCookie = getCookie(request, "locale") || '';
  const language = getPreferredSupportedLanguage(languageCookie, '') || getPreferredSupportedLanguage(acceptLanguage);

  const destination =
    language === "en"
      ? basePath
      : `${basePath}${language}/`;

  // Avoid redirecting / to itself for English.
  if (url.pathname === destination) {
    return next();
  }

  url.pathname = destination;

  return Response.redirect(url.toString(), 302);
}