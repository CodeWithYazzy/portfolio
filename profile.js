/* Confirmed content only. Null fields deliberately remain visible placeholders.
   Brand, title, introduction, skills and public links are confirmed.
   The exact display name remains unanswered and is intentionally null. Never put secrets here. */
window.PORTFOLIO_PROFILE = {
  name: null,
  title: "Class 10 student · Aspiring machine learning engineer",
  introduction:
    "I’m learning Python, working with NumPy, and exploring PyTorch to understand how machine learning models are built and trained.",
  biography: null,
  skills: [
    "Python · advanced topics in progress",
    "NumPy · working knowledge",
    "PyTorch · currently learning",
  ],
  education:
    "Currently studying in Class 10. Learning programming and machine learning alongside school.",
  email: "codewithyazzy@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/codewithyazzy" },
    { label: "YouTube", url: "https://youtube.com/codewithyazzy" },
  ],
};
(() => {
  const p = window.PORTFOLIO_PROFILE;
  for (const key of [
    "name",
    "title",
    "introduction",
    "biography",
    "education",
  ]) {
    if (typeof p[key] !== "string" || !p[key].trim()) continue;
    document.querySelectorAll(`[data-profile="${key}"]`).forEach((el) => {
      el.textContent = p[key];
      el.classList.remove("placeholder");
    });
  }
  const skills = document.getElementById("profileSkills");
  if (skills && p.skills.length) {
    skills.replaceChildren();
    const list = document.createElement("div");
    list.className = "skill-tags";
    p.skills.forEach((skill) => {
      const tag = document.createElement("span");
      tag.textContent = String(skill);
      list.append(tag);
    });
    skills.append(list);
  }
  const links = p.links.filter((link) => {
    try {
      const u = new URL(link.url);
      return (
        u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        typeof link.label === "string"
      );
    } catch {
      return false;
    }
  });
  if (links.length)
    document.querySelectorAll("[data-social-links]").forEach((el) => {
      el.replaceChildren();
      el.classList.add("social-links");
      links.forEach((link) => {
        const a = document.createElement("a");
        a.href = link.url;
        a.textContent = link.label + " ↗";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        el.append(a);
      });
    });
  const email = document.getElementById("profileEmail");
  if (
    email &&
    typeof p.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
    !/[\r\n]/.test(p.email)
  ) {
    email.replaceChildren();
    email.classList.remove("placeholder");
    const a = document.createElement("a");
    a.href = "mailto:" + p.email;
    a.textContent = p.email;
    a.className = "contact-email";
    email.append(a);
  }
})();
