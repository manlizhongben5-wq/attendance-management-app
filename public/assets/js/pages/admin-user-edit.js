// =============================================
// admin-user-edit.html 専用
// =============================================
(() => {
  const radios = document.querySelectorAll('input[name="userType"]');
  const courseField = document.getElementById('courseField');
  const courseSelect = document.getElementById('course');

  function applyUserType() {
    const selected = document.querySelector('input[name="userType"]:checked')?.value;

    if (selected === "student") {
      courseField.classList.remove("is-hidden");
      courseSelect.disabled = false;
    } else {
      courseField.classList.add("is-hidden");
      courseSelect.disabled = true;
      courseSelect.value = "";
    }
  }

  radios.forEach(r => r.addEventListener("change", applyUserType));

  // initial state: teacher => hide course
  applyUserType();
})();