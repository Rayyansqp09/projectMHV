

document.addEventListener('DOMContentLoaded', function () {

  const modal = document.getElementById('modalOverlay');
  const updateButtons = document.querySelectorAll('.Dt-btn');
  const closeBtn = document.getElementById('closeBtn');
  const doneBtn = document.getElementById('doneBtn');
  const statCategoryInput = document.getElementById('statCategoryInput');
  const tableNameInput = document.getElementById('tableNameInput');
  const statCategoryDisplay = document.getElementById('statCategoryDisplay');
  const tableNameDisplay = document.getElementById('tableNameDisplay');
  const statsForm = document.getElementById('statsForm');
  const submitBtn = document.getElementById('submitBtn');

  // Show modal on any UPDATE button click
  updateButtons.forEach(button => {
    button.addEventListener('click', () => {
      const stat = button.getAttribute('data-stat');
      const table = button.getAttribute('table');

      // Fill in the hidden form inputs and display labels
      statCategoryInput.value = stat;
      statCategoryDisplay.textContent = `Stat: ${stat}`;

      tableNameInput.value = table;
      tableNameDisplay.textContent = `Table: ${table}`;

      // Show the modal
      modal.style.display = 'block';
    });
  });

  // Close modal on close button or done button click
  [closeBtn, doneBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  // Close modal if clicking outside modal content
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Validate inputs before submit
  submitBtn.addEventListener('click', function (e) {
    const games = document.getElementById('Games').value.trim();
    const goals = document.getElementById('Goals').value.trim();
    const assists = document.getElementById('Assists').value.trim();
    const customName = document.getElementById('customStatName').value.trim();
    const customValue = document.getElementById('customStatValue').value.trim();

    // If all are empty
    if (!games && !goals && !assists && (!customName || !customValue)) {
      e.preventDefault();
      alert('⚠️ Please fill at least one stat before submitting.');
      return false;
    }

    // Dynamically create hidden input for the custom stat (if filled)
    if (customName && customValue) {
      const existing = document.getElementById(`auto-${customName}`);
      if (!existing) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = customName;
        hiddenInput.id = `auto-${customName}`;
        hiddenInput.value = customValue;
        statsForm.appendChild(hiddenInput);
      }
    }
  });

});

//menu label at bottom

function toggleMenu() {
  const menu = document.getElementById("dropup-menu");
  const submenu = document.getElementById("submenu");

  if (menu.classList.contains("show")) {
    // Hide menu with transition
    menu.classList.remove("show");
    setTimeout(() => {
      menu.style.display = "none";
    }, 300); // match transition duration
  } else {
    menu.style.display = "flex"; // make it visible before triggering animation
    setTimeout(() => {
      menu.classList.add("show");
    }, 10); // small delay to allow transition
  }

  submenu.style.display = "none"; // reset submenu
}



function toggleSubmenu(event, element) {
  event.preventDefault();
  event.stopPropagation();

  const submenu = element.nextElementSibling;

  // Close only sibling submenus at the same level
  const allSiblings = element.parentElement.parentElement.querySelectorAll(':scope > .submenu-container > .submenu');
  allSiblings.forEach(sib => {
    if (sib !== submenu) sib.style.display = 'none';
  });

  submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
}



// Optional: Close on outside click
window.onclick = function (e) {
  const menu = document.getElementById("dropup-menu");
  if (!e.target.closest('.menu-wrapper') && !e.target.closest('.menu-btn')) {
    menu.classList.remove("show");
    setTimeout(() => {
      menu.style.display = "none";
    }, 300);
  }

  // Close all submenus
  document.querySelectorAll('.submenu').forEach(menu => {
    menu.style.display = 'none';
  });
};

// public/js/highlightStats.js
document.addEventListener("DOMContentLoaded", function () {
  const keywords = ['GAMES', 'GOALS', 'ASSISTS'];
  document.querySelectorAll('.stat-name').forEach(el => {
    if (keywords.includes(el.textContent.trim())) {
      el.classList.add('highlight');
    }
  });
});

