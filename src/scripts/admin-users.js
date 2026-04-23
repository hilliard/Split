let allUsers = [];
let currentEditingUserId = null;

async function loadUsers() {
  try {
    const response = await fetch('/api/users/list');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    allUsers = await response.json();
    renderUsers(allUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    const container = document.getElementById('users-container');
    if (container) {
      container.innerHTML = '<div class="text-red-500 text-center py-8">Error loading users</div>';
    }
  }
}

function renderUsers(users) {
  const container = document.getElementById('users-container');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No users found</div>';
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 border-b sticky top-0">
          <tr>
            <th class="text-left px-4 py-3 font-semibold">Name</th>
            <th class="text-left px-4 py-3 font-semibold">Username</th>
            <th class="text-left px-4 py-3 font-semibold">Email</th>
            <th class="text-left px-4 py-3 font-semibold">Role</th>
            <th class="text-left px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          ${users
            .map(
              (user) => `
            <tr>
              <td class="px-4 py-3">
                <div class="font-medium">${user.firstName || ''} ${user.lastName || ''}</div>
                <div class="text-xs text-gray-500">${user.id?.substring(0, 8)}...</div>
              </td>
              <td class="px-4 py-3">
                <code class="bg-gray-100 px-2 py-1 rounded text-xs">${user.username || '-'}</code>
              </td>
              <td class="px-4 py-3 text-xs">${user.email || '-'}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.systemRole === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }">
                  ${user.systemRole || 'user'}
                </span>
              </td>
              <td class="px-4 py-3 space-x-2">
                <button class="edit-btn text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" data-user-id="${user.id}">
                  Edit
                </button>
                <button class="delete-btn text-red-600 hover:text-red-800 font-medium text-xs hover:underline" data-user-id="${user.id}">
                  Delete
                </button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="text-xs text-gray-500 mt-4">Total: ${users.length} users</div>
  `;
}

function openEditModal(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return;

  currentEditingUserId = userId;

  document.getElementById('edit-firstName').value = user.firstName || '';
  document.getElementById('edit-lastName').value = user.lastName || '';
  document.getElementById('edit-email').value = user.email || '';
  document.getElementById('edit-username').value = user.username || '';
  document.getElementById('edit-role').value = user.systemRole || 'user';

  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  currentEditingUserId = null;
}

async function submitEditForm(e) {
  e.preventDefault();

  if (!currentEditingUserId) return;

  const firstName = document.getElementById('edit-firstName').value;
  const lastName = document.getElementById('edit-lastName').value;
  const email = document.getElementById('edit-email').value;
  const systemRole = document.getElementById('edit-role').value;

  try {
    const infoResponse = await fetch(`/api/users/${currentEditingUserId}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email }),
    });

    if (!infoResponse.ok) {
      throw new Error(`Failed to update user info: ${infoResponse.status}`);
    }

    const user = allUsers.find((u) => u.id === currentEditingUserId);
    if (user && user.systemRole !== systemRole) {
      const roleResponse = await fetch(`/api/users/${currentEditingUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemRole }),
      });

      if (!roleResponse.ok) {
        throw new Error(`Failed to update role: ${roleResponse.status}`);
      }
    }

    closeEditModal();
    await loadUsers();
    alert('User updated successfully!');
  } catch (error) {
    console.error('Error updating user:', error);
    alert(`Failed to update user: ${error}`);
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/role`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await loadUsers();
    alert('User deleted successfully!');
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

function refreshUsers() {
  loadUsers();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const usersContainer = document.getElementById('users-container');
  if (usersContainer) {
    usersContainer.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('edit-btn')) {
        const userId = target.getAttribute('data-user-id');
        if (userId) openEditModal(userId);
      } else if (target.classList.contains('delete-btn')) {
        const userId = target.getAttribute('data-user-id');
        if (userId) deleteUser(userId);
      }
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (!query) {
        renderUsers(allUsers);
        return;
      }
      const filtered = allUsers.filter(
        (u) =>
          (u.firstName + ' ' + (u.lastName || '')).toLowerCase().includes(query) ||
          (u.email || '').toLowerCase().includes(query) ||
          (u.username || '').toLowerCase().includes(query)
      );
      renderUsers(filtered);
    });
  }

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadUsers);
  }

  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeEditModal();
    });
  }

  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', submitEditForm);
  }

  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEditModal();
      }
    });
  }

  loadUsers();
});
