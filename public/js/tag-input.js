/* eslint-disable no-unused-vars */
/**
 * Tag input autocomplete component.
 * Usage: initTagInput('elementId', '/api/tags')
 */
function initTagInput(inputId, apiUrl) {
  const input = document.getElementById(inputId);
  const chipsContainer = document.getElementById(`${inputId}-chips`);
  const suggestionsEl = document.getElementById(`${inputId}-suggestions`);
  const hiddenInput = document.getElementById(`${inputId}-hidden`);
  const selectedTags = [];

  // Load existing tags from chips
  chipsContainer.querySelectorAll('.tag-chip').forEach((chip) => {
    selectedTags.push({
      id: parseInt(chip.dataset.tagId, 10),
      name: chip.dataset.tagName,
    });
  });
  updateHidden();

  // Wire up remove buttons on existing chips
  chipsContainer.querySelectorAll('.tag-chip .btn-close').forEach((btn) => {
    btn.addEventListener('click', function removeChip() {
      const chip = this.closest('.tag-chip');
      const tagId = parseInt(chip.dataset.tagId, 10);
      const idx = selectedTags.findIndex((t) => t.id === tagId);
      if (idx > -1) selectedTags.splice(idx, 1);
      chip.remove();
      updateHidden();
    });
  });

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (!query) {
      hideSuggestions();
      return;
    }
    debounceTimer = setTimeout(() => fetchSuggestions(query), 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) return;

      // Check if there's an exact match in suggestions or selected
      const alreadySelected = selectedTags.some(
        (t) => t.name.toLowerCase() === value.toLowerCase(),
      );
      if (alreadySelected) {
        input.value = '';
        hideSuggestions();
        return;
      }

      // Create new tag
      addTag({ id: 0, name: value, isNew: true });
      input.value = '';
      hideSuggestions();
    }
  });

  // Close suggestions on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest(`#${inputId}-container`)) {
      hideSuggestions();
    }
  });

  function fetchSuggestions(query) {
    fetch(`${apiUrl}?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((tags) => {
        showSuggestions(tags, query);
      })
      .catch(() => hideSuggestions());
  }

  function showSuggestions(tags, query) {
    suggestionsEl.innerHTML = '';
    const filtered = tags.filter(
      (t) => !selectedTags.some((s) => s.id === t.id),
    );

    filtered.forEach((tag) => {
      const item = document.createElement('a');
      item.className = 'dropdown-item';
      item.href = '#';
      item.textContent = tag.name;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        addTag(tag);
        input.value = '';
        hideSuggestions();
      });
      suggestionsEl.appendChild(item);
    });

    // Show "create new" option if no exact match
    const exactMatch = tags.some(
      (t) => t.normalized_name === query.toLowerCase(),
    );
    if (!exactMatch && query) {
      const createItem = document.createElement('a');
      createItem.className = 'dropdown-item text-primary';
      createItem.href = '#';
      createItem.textContent = `Create "${query}"`;
      createItem.addEventListener('click', (e) => {
        e.preventDefault();
        addTag({ id: 0, name: query, isNew: true });
        input.value = '';
        hideSuggestions();
      });
      suggestionsEl.appendChild(createItem);
    }

    if (suggestionsEl.children.length > 0) {
      suggestionsEl.classList.add('show');
      suggestionsEl.style.display = 'block';
    } else {
      hideSuggestions();
    }
  }

  function hideSuggestions() {
    suggestionsEl.classList.remove('show');
    suggestionsEl.style.display = 'none';
  }

  function addTag(tag) {
    const alreadySelected = selectedTags.some(
      (t) => t.name.toLowerCase() === tag.name.toLowerCase(),
    );
    if (alreadySelected) return;

    selectedTags.push(tag);

    const chip = document.createElement('span');
    chip.className = 'badge bg-primary me-1 mb-1 tag-chip';
    chip.dataset.tagId = tag.id;
    chip.dataset.tagName = tag.name;
    chip.textContent = tag.name;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close btn-close-white ms-1';
    closeBtn.type = 'button';
    closeBtn.style.fontSize = '0.6em';
    closeBtn.addEventListener('click', () => {
      const idx = selectedTags.findIndex(
        (t) => t.name.toLowerCase() === tag.name.toLowerCase(),
      );
      if (idx > -1) selectedTags.splice(idx, 1);
      chip.remove();
      updateHidden();
    });

    chip.appendChild(closeBtn);
    chipsContainer.appendChild(chip);
    updateHidden();
  }

  function updateHidden() {
    hiddenInput.value = selectedTags.map((t) => t.name).join(',');
  }

  return {
    getSelectedTags() { return selectedTags; },
    clear() {
      selectedTags.length = 0;
      chipsContainer.querySelectorAll('.tag-chip').forEach((c) => c.remove());
      updateHidden();
    },
  };
}
