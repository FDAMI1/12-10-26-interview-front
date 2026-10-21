/*
 * Who operates this service. Fill both in before publishing - they appear on
 * the privacy policy and the delete-account page. While empty, those pages
 * point readers to the contact details on the app's store listing instead.
 */
window.SITE = {
  operator: "",
  supportEmail: "",
};

document.addEventListener("DOMContentLoaded", function () {
  const s = window.SITE;
  document.querySelectorAll("[data-operator]").forEach(function (el) {
    el.textContent = s.operator || "the operator of Aivarnix";
  });
  document.querySelectorAll("[data-contact]").forEach(function (el) {
    if (s.supportEmail) {
      const a = document.createElement("a");
      a.href = "mailto:" + s.supportEmail;
      a.textContent = s.supportEmail;
      el.textContent = "";
      el.appendChild(a);
    } else {
      el.textContent = "the developer contact email shown on the app's Google Play listing";
    }
  });
});
