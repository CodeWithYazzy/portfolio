/* Same-origin contact UI. No credentials or message persistence in the browser. */
(() => {
  "use strict";
  const form = document.querySelector("#contactForm");
  if (!form) return;
  const fields = ["name", "email", "subject", "message"].map((id) =>
    document.getElementById(id),
  );
  const fieldset = document.getElementById("contactFields");
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = form.querySelector(".contact-submit-label");
  const status = document.getElementById("formStatus");
  const availability = document.getElementById("contactAvailability");
  const verificationStatus = document.getElementById("verificationStatus");
  const success = document.getElementById("contactSuccess");
  let config = null;
  let busy = false;
  let interacted = false;
  let token = "";
  let widgetId;
  let widgetPromise;
  let tokenWaiter;
  let submissionKey;
  let submissionValue;

  function setStatus(message, state = "ready") {
    status.textContent = message;
    form.dataset.state = state;
  }

  function setBusy(value, label = "Sending…") {
    busy = value;
    fieldset.disabled = value;
    submit.disabled = value || !config?.enabled;
    form.setAttribute("aria-busy", String(value));
    submitLabel.textContent = value ? label : "Send message";
  }

  function setError(field, message) {
    document.getElementById(`${field.id}Error`).textContent = message;
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }

  function validationMessage(field) {
    const value = field.value.trim();
    const labels = {
      name: "your name",
      email: "your email address",
      subject: "a subject",
      message: "a message",
    };
    if (!value) return `Please enter ${labels[field.id]}.`;
    if (
      field.id === "email" &&
      (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    )
      return "Please enter a valid email address.";
    if (field.id !== "message" && /[\r\n\u0000-\u001f\u007f]/.test(value))
      return "Please use a single line of text.";
    const minimum = { name: 2, email: 1, subject: 3, message: 20 }[field.id];
    if (value.length < minimum)
      return `Please write at least ${minimum} characters.`;
    if (value.length > field.maxLength)
      return `Please use no more than ${field.maxLength.toLocaleString()} characters.`;
    return "";
  }

  async function request(url, options, timeout = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        credentials: "omit",
        signal: controller.signal,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      return { response, data };
    } finally {
      clearTimeout(timer);
    }
  }

  function receiveToken(value) {
    token = typeof value === "string" ? value : "";
    verificationStatus.textContent = token
      ? "Spam check complete."
      : "Please complete the spam check.";
    if (token && tokenWaiter) {
      tokenWaiter.resolve(token);
      tokenWaiter = null;
    }
  }

  function verificationFailed() {
    token = "";
    verificationStatus.textContent =
      "Spam protection couldn’t connect. Check your connection and try again.";
    if (tokenWaiter) {
      tokenWaiter.reject(new Error("verification"));
      tokenWaiter = null;
    }
  }

  function loadVerification() {
    if (widgetPromise) return widgetPromise;
    widgetPromise = new Promise((resolve, reject) => {
      if (!config?.enabled) {
        reject(new Error("disabled"));
        return;
      }
      verificationStatus.textContent = "Preparing spam protection…";
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      let finished = false;
      const timer = setTimeout(fail, 12000);
      function fail() {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.remove();
        widgetPromise = null;
        verificationFailed();
        reject(new Error("verification"));
      }
      script.onerror = fail;
      script.onload = () => {
        if (finished) return;
        try {
          if (!window.turnstile?.render) {
            fail();
            return;
          }
          widgetId = window.turnstile.render("#contactVerification", {
            sitekey: config.siteKey,
            action: "contact",
            theme: "auto",
            size: "compact",
            appearance: "interaction-only",
            callback: receiveToken,
            "expired-callback": () => {
              token = "";
              verificationStatus.textContent =
                "Spam check expired. Verify again to send.";
            },
            "error-callback": () => {
              verificationFailed();
              return true;
            },
            "timeout-callback": verificationFailed,
          });
          finished = true;
          clearTimeout(timer);
          resolve();
        } catch {
          fail();
        }
      };
      document.head.append(script);
    });
    return widgetPromise;
  }

  async function getToken() {
    await loadVerification();
    if (token) return token;
    verificationStatus.textContent =
      "Complete the spam check to send your message.";
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        tokenWaiter = null;
        reject(new Error("verification"));
      }, 45000);
      tokenWaiter = {
        resolve(value) {
          clearTimeout(timer);
          resolve(value);
        },
        reject(error) {
          clearTimeout(timer);
          reject(error);
        },
      };
    });
  }

  function resetVerification() {
    token = "";
    if (widgetId !== undefined && window.turnstile?.reset) {
      try {
        window.turnstile.reset(widgetId);
      } catch {
        /* A provider refresh can be retried on the next interaction. */
      }
    }
  }

  function newKey() {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function startVerification() {
    interacted = true;
    if (config?.enabled) loadVerification().catch(() => {});
  }

  form.addEventListener("focusin", startVerification);
  fields.forEach((field) =>
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid"))
        setError(field, validationMessage(field));
    }),
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !config?.enabled) return;
    let firstInvalid;
    fields.forEach((field) => {
      const message = validationMessage(field);
      setError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      setStatus("Please check the highlighted fields.", "error");
      firstInvalid.focus();
      return;
    }
    const payload = Object.fromEntries(
      fields.map((field) => [field.id, field.value.trim()]),
    );
    payload.website = document.getElementById("contactWebsite").value;
    // Keep a key only in memory so an unchanged retry cannot send a duplicate.
    const value = JSON.stringify(payload);
    if (value !== submissionValue) {
      submissionKey = newKey();
      submissionValue = value;
    }
    setBusy(true, token ? "Sending…" : "Verifying…");
    setStatus("Preparing your message…", "sending");
    let attempted = false;
    try {
      payload.turnstileToken = await getToken();
      payload.idempotencyKey = submissionKey;
      submitLabel.textContent = "Sending…";
      setStatus("Sending your message…", "sending");
      attempted = true;
      const { response, data } = await request(
        "/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
        20000,
      );
      if (!response.ok || data.ok !== true) {
        const messages = {
          403: "The spam check couldn’t be verified. Please try again.",
          409: "This message is still being processed. Wait a moment, then retry without changing it.",
          413: "Your message is too long. Please shorten it and try again.",
          429: "Too many attempts. Please wait a few minutes before trying again.",
          503: "Messaging is temporarily unavailable. Your text is still here. Please try later or use the email address alongside this form.",
        };
        let firstServerError;
        if (data.fieldErrors && typeof data.fieldErrors === "object") {
          fields.forEach((field) => {
            const message = data.fieldErrors[field.id];
            if (typeof message === "string") {
              setError(field, message.slice(0, 200));
              firstServerError ||= field;
            }
          });
        }
        setStatus(
          firstServerError
            ? "Please check the highlighted fields."
            : messages[response.status] ||
                "Your message couldn’t be sent. Your text is still here; please try again.",
          "error",
        );
        setBusy(false);
        firstServerError?.focus();
        return;
      }
      form.reset();
      submissionKey = undefined;
      submissionValue = undefined;
      fieldset.hidden = true;
      success.hidden = false;
      setStatus("Your message was accepted for delivery.", "success");
      success.focus({ preventScroll: true });
    } catch (error) {
      const message =
        error.message === "verification"
          ? "Spam protection is not ready. Complete the check or try again. Your message is still here."
          : attempted
            ? "The connection was interrupted. Your message may have been accepted; retry the same message safely."
            : "Messaging is temporarily unavailable. Your message is still here.";
      setStatus(message, "error");
    } finally {
      setBusy(false);
      // Verification tokens are single-use. The idempotency key survives a retry.
      if (attempted) resetVerification();
    }
  });

  document.getElementById("contactAgain").addEventListener("click", () => {
    success.hidden = true;
    fieldset.hidden = false;
    setStatus("");
    fields[0].focus();
  });

  (async () => {
    try {
      const { response, data } = await request(
        "/api/contact-config",
        { headers: { Accept: "application/json" }, cache: "no-store" },
        8000,
      );
      if (
        response.ok &&
        data.enabled === true &&
        typeof data.siteKey === "string" &&
        data.siteKey.length > 0
      ) {
        config = { enabled: true, siteKey: data.siteKey };
        availability.hidden = true;
        submit.disabled = false;
        form.dataset.state = "ready";
        if (interacted) startVerification();
        return;
      }
    } catch {
      /* Static previews and offline connections stay safely unavailable. */
    }
    config = { enabled: false };
    availability.textContent =
      "Direct messaging isn’t available yet. Please use the email address alongside this form.";
    form.dataset.state = "unavailable";
    submitLabel.textContent = "Messaging unavailable";
    submit.disabled = true;
  })();
})();
