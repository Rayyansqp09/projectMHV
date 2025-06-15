

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
