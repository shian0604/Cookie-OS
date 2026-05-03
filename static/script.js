console.log("script.js loaded");

// static/js/script.js

// Make function global so inline onclick still works if present
window.addRandomProcess = function () {
    const pid = Math.floor(Math.random() * 1000);
    const names = ["Chrome", "VSCode", "Python", "Node", "GameEngine"];
    const name = names[Math.floor(Math.random() * names.length)];
    const priority = Math.floor(Math.random() * 10) + 1;
    const states = ["Ready", "Running", "Waiting"];
    const state = states[Math.floor(Math.random() * states.length)];

    // Create a row styled like table-label
    const row = document.createElement("div");
    row.classList.add("table-label", "process-row"); // add process-row for styling

    row.innerHTML = `
        <p>${pid}</p>
        <p>${name}</p>
        <p>${priority}</p>
        <p>${state}</p>
    `;

    const container = document.getElementById("process-container");
    if (!container) {
        console.error("process-container not found in DOM");
        return;
    }

    container.appendChild(row);
};

// Attach event listeners after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Prefer event binding over inline onclick
    const btn = document.querySelector(".add-process-btn");
    if (btn) btn.addEventListener("click", addRandomProcess);

    // Wire reset button (second .control-button inside .process-controls)
    const resetBtn = document.querySelector(".process-table .process-controls .control-button:nth-child(2)");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            const container = document.getElementById("process-container");
            if (container) container.innerHTML = "";
        });
    }
});
