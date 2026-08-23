(function (window) {
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
  const allowedTypes = new Set(['PDF', 'DOC', 'DOCX', 'TXT', 'PNG', 'JPG']);

  const state = {
    user: null,
    documents: [],
    auditLogs: [],
    selectedFile: null,
    uploadProgress: 0,
    uploadTimer: null,
    documentSearch: '',
    documentFilter: 'all',
    documentSort: 'newest',
    auditSearch: '',
    auditActionFilter: 'all',
    auditDateFilter: '',
    auditVisibleCount: 5,
    activeMenuId: null,
    detailsFileId: null
  };

  let dom = {};

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes === 0) {
      return '0 KB';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes);
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }

    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatDateTime(isoValue) {
    const date = new Date(isoValue);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function formatUploadDate(isoValue) {
    const date = new Date(isoValue);
    const now = new Date();
    const delta = now.getTime() - date.getTime();
    const days = Math.floor(delta / (24 * 60 * 60 * 1000));

    if (days <= 0) {
      return 'Today';
    }

    if (days === 1) {
      return 'Yesterday';
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function getDocumentCategory(fileType) {
    const type = String(fileType || '').toUpperCase();
    if (type === 'PDF') {
      return 'pdf';
    }
    if (type === 'DOC' || type === 'DOCX') {
      return 'doc';
    }
    if (['PNG', 'JPG', 'JPEG'].includes(type)) {
      return 'images';
    }
    return 'other';
  }

  function getStatusBadgeClass(status) {
    const value = String(status || '').toLowerCase();
    if (value.includes('encrypt')) {
      return 'encrypted';
    }
    if (value.includes('success')) {
      return 'success';
    }
    if (value.includes('warn')) {
      return 'warning';
    }
    if (value.includes('fail') || value.includes('deny')) {
      return 'danger';
    }
    return 'neutral';
  }

  function getActionBadgeClass(action) {
    const value = String(action || '').toUpperCase();
    if (value === 'UPLOAD') {
      return 'success';
    }
    if (value === 'DOWNLOAD') {
      return 'info';
    }
    if (value === 'VIEW') {
      return 'neutral';
    }
    if (value === 'DELETE') {
      return 'danger';
    }
    return 'neutral';
  }

  function showToast(title, message, variant = 'info') {
    if (!dom.toastContainer) {
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${variant}`;
    toast.innerHTML = `<strong>${title}</strong><div>${message}</div>`;
    dom.toastContainer.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function setPageLoading(isLoading) {
    if (!dom.pageLoading) {
      return;
    }

    dom.pageLoading.classList.toggle('is-hidden', !isLoading);
  }

  function renderSummaryCards(stats) {
    if (!dom.summaryCards) {
      return;
    }

    const cards = [
      {
        label: 'Total Documents',
        value: String(stats.totalDocuments),
        subvalue: 'Stored in your private vault'
      },
      {
        label: 'Storage Used',
        value: formatBytes(stats.storageUsed),
        subvalue: 'Encrypted at rest'
      },
      {
        label: 'Recent Accesses',
        value: String(stats.recentAccesses),
        subvalue: 'Last 7 days'
      },
      {
        label: 'Security Status',
        value: stats.securityStatus,
        subvalue: 'Demo security posture'
      }
    ];

    dom.summaryCards.innerHTML = cards.map((card) => `
      <article class="card summary-card">
        <p class="eyebrow">${card.label}</p>
        <p class="value">${card.value}</p>
        <p class="subvalue">${card.subvalue}</p>
      </article>
    `).join('');
  }

  function getFilteredDocuments() {
    let documents = [...state.documents];

    const searchTerm = state.documentSearch.trim().toLowerCase();
    if (searchTerm) {
      documents = documents.filter((file) => {
        return `${file.fileName} ${file.fileType}`.toLowerCase().includes(searchTerm);
      });
    }

    if (state.documentFilter !== 'all') {
      documents = documents.filter((file) => {
        const category = getDocumentCategory(file.fileType);
        if (state.documentFilter === 'images') {
          return category === 'images';
        }
        if (state.documentFilter === 'doc') {
          return category === 'doc';
        }
        if (state.documentFilter === 'pdf') {
          return category === 'pdf';
        }
        return category === 'other';
      });
    }

    if (state.documentSort === 'oldest') {
      documents.sort((left, right) => new Date(left.uploadedAt) - new Date(right.uploadedAt));
    } else if (state.documentSort === 'name') {
      documents.sort((left, right) => left.fileName.localeCompare(right.fileName));
    } else if (state.documentSort === 'size') {
      documents.sort((left, right) => Number(right.size) - Number(left.size));
    } else {
      documents.sort((left, right) => new Date(right.uploadedAt) - new Date(left.uploadedAt));
    }

    return documents;
  }

  function renderDocuments() {
    if (!dom.documentsTbody || !dom.documentsEmptyState || !dom.documentsCount) {
      return;
    }

    const documents = getFilteredDocuments();
    dom.documentsCount.textContent = `${documents.length} file${documents.length === 1 ? '' : 's'}`;

    if (!documents.length) {
      dom.documentsTbody.innerHTML = '';
      dom.documentsEmptyState.hidden = false;
      return;
    }

    dom.documentsEmptyState.hidden = true;
    dom.documentsTbody.innerHTML = documents.map((file) => {
      const menuOpen = state.activeMenuId === file.fileId;
      return `
        <tr>
          <td>
            <div class="file-name">${file.fileName}</div>
          </td>
          <td>${file.fileType}</td>
          <td>${formatBytes(file.size)}</td>
          <td>${formatUploadDate(file.uploadedAt)}</td>
          <td><span class="status-badge encrypted">${file.status}</span></td>
          <td>
            <div class="row-actions">
              <button class="mini-button" type="button" data-action="download" data-file-id="${file.fileId}">Download</button>
              <button class="mini-button" type="button" data-action="details" data-file-id="${file.fileId}">View details</button>
              <button class="icon-button" type="button" aria-haspopup="menu" aria-expanded="${menuOpen ? 'true' : 'false'}" data-action="menu" data-file-id="${file.fileId}">⋮</button>
              <div class="action-menu" role="menu" ${menuOpen ? '' : 'hidden'}>
                <button class="menu-item" type="button" data-action="copy-id" data-file-id="${file.fileId}">Copy File ID</button>
                <button class="menu-item danger" type="button" data-action="delete" data-file-id="${file.fileId}">Delete</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getAuditTimestamp(entry) {
    return entry && (entry.timestamp || entry.dateTime) ? (entry.timestamp || entry.dateTime) : null;
  }

  function getFilteredAuditLogs() {
    let logs = [...state.auditLogs];

    const searchTerm = state.auditSearch.trim().toLowerCase();
    if (searchTerm) {
      logs = logs.filter((entry) => {
        return [entry.fileName, entry.action, entry.user, entry.ipAddress].join(' ').toLowerCase().includes(searchTerm);
      });
    }

    if (state.auditActionFilter !== 'all') {
      logs = logs.filter((entry) => entry.action === state.auditActionFilter);
    }

    if (state.auditDateFilter) {
      logs = logs.filter((entry) => {
        const auditTime = getAuditTimestamp(entry);
        if (!auditTime) {
          return false;
        }
        return new Date(auditTime).toISOString().slice(0, 10) === state.auditDateFilter;
      });
    }

    return logs;
  }

  function renderAuditLogs() {
    if (!dom.auditTbody || !dom.auditEmptyState || !dom.auditCount || !dom.loadMoreAuditButton) {
      return;
    }

    const logs = getFilteredAuditLogs();
    dom.auditCount.textContent = `${logs.length} event${logs.length === 1 ? '' : 's'}`;

    const visibleLogs = logs.slice(0, state.auditVisibleCount);
    dom.auditTbody.innerHTML = visibleLogs.map((entry) => {
      const auditTime = getAuditTimestamp(entry);
      return `
        <tr>
          <td>${entry.fileName}</td>
          <td><span class="status-badge ${getActionBadgeClass(entry.action)}">${entry.action}</span></td>
          <td>${entry.user || 'Unknown'}</td>
          <td>${formatDateTime(auditTime)}</td>
          <td>${entry.ipAddress || 'N/A'}</td>
          <td><span class="status-badge ${getStatusBadgeClass(entry.status)}">${entry.status}</span></td>
        </tr>
      `;
    }).join('');

    dom.auditEmptyState.hidden = logs.length > 0;
    const hasMore = logs.length > state.auditVisibleCount;
    dom.loadMoreAuditButton.hidden = !hasMore;
    dom.loadMoreAuditButton.disabled = !hasMore;
  }

  function renderDetailsModal(file) {
    if (!dom.detailsContent || !dom.detailsModal) {
      return;
    }

    dom.detailsContent.innerHTML = `
      <div class="details-row"><span>File Name</span><strong>${file.fileName}</strong></div>
      <div class="details-row"><span>File Type</span><strong>${file.fileType}</strong></div>
      <div class="details-row"><span>Size</span><strong>${formatBytes(file.size)}</strong></div>
      <div class="details-row"><span>Uploaded</span><strong>${formatDateTime(file.uploadedAt)}</strong></div>
      <div class="details-row"><span>Status</span><strong>${file.status}</strong></div>
      <div class="details-row"><span>Security</span><strong>Protected in Demo Mode</strong></div>
    `;

    dom.detailsModal.hidden = false;
  }

  function closeDetailsModal() {
    if (!dom.detailsModal) {
      return;
    }

    dom.detailsModal.hidden = true;
    dom.detailsModal.setAttribute('aria-hidden', 'true');
    state.detailsFileId = null;
  }

  function resetUploadState() {
    state.selectedFile = null;
    state.uploadProgress = 0;

    if (dom.uploadProgressBar) {
      dom.uploadProgressBar.style.width = '0%';
    }
    if (dom.selectedFileName) {
      dom.selectedFileName.textContent = 'No file selected';
    }
    if (dom.selectedFileSize) {
      dom.selectedFileSize.textContent = '0 KB';
    }
    if (dom.uploadError) {
      dom.uploadError.textContent = '';
    }
    if (dom.uploadButton) {
      dom.uploadButton.disabled = true;
      dom.uploadButton.textContent = 'Upload';
    }
    if (dom.uploadInput) {
      dom.uploadInput.value = '';
    }
  }

  function validateSelectedFile(file) {
    if (!file) {
      return { valid: false, message: 'Please select a valid file.' };
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return { valid: false, message: 'Maximum demo file size is 10 MB.' };
    }

    const type = window.SecureVaultAPI.getFileTypeFromName(file.name);
    if (!allowedTypes.has(type)) {
      return { valid: false, message: 'Unsupported file type. Use PDF, DOC, DOCX, TXT, PNG, or JPG.' };
    }

    return { valid: true, message: '' };
  }

  function setSelectedFile(file) {
    const validation = validateSelectedFile(file);
    if (!validation.valid) {
      resetUploadState();
      if (dom.uploadError) {
        dom.uploadError.textContent = validation.message;
      }
      showToast('Error', validation.message, 'error');
      return;
    }

    state.selectedFile = file;
    if (dom.selectedFileName) {
      dom.selectedFileName.textContent = file.name;
    }
    if (dom.selectedFileSize) {
      dom.selectedFileSize.textContent = formatBytes(file.size);
    }
    if (dom.uploadError) {
      dom.uploadError.textContent = '';
    }
    if (dom.uploadButton) {
      dom.uploadButton.disabled = false;
    }
  }

  function startUploadProgress() {
    if (state.uploadTimer) {
      window.clearInterval(state.uploadTimer);
    }

    state.uploadProgress = 0;
    if (dom.uploadProgressBar) {
      dom.uploadProgressBar.style.width = '0%';
    }

    state.uploadTimer = window.setInterval(() => {
      state.uploadProgress += 12;
      if (dom.uploadProgressBar) {
        dom.uploadProgressBar.style.width = `${Math.min(state.uploadProgress, 100)}%`;
      }

      if (state.uploadProgress >= 100) {
        window.clearInterval(state.uploadTimer);
        state.uploadTimer = null;
      }
    }, 140);
  }

  async function handleUpload() {
    if (!state.selectedFile || !dom.uploadButton) {
      showToast('Error', 'Please select a valid file.', 'error');
      return;
    }

    dom.uploadButton.disabled = true;
    dom.uploadButton.textContent = 'Uploading...';
    if (dom.cancelUploadButton) {
      dom.cancelUploadButton.disabled = true;
    }

    startUploadProgress();

    try {
      const response = await window.SecureVaultAPI.uploadFile({
        fileName: state.selectedFile.name,
        fileType: state.selectedFile.type || window.SecureVaultAPI.getFileTypeFromName(state.selectedFile.name),
        size: state.selectedFile.size
      });

      console.debug('[SecureVault] POST /upload response', response);

      if (!response || response.success !== true) {
        throw new Error(response && response.message ? response.message : 'Upload request failed.');
      }

      const uploadUrl = response.uploadUrl || (response.data && response.data.uploadUrl);
      console.debug('[SecureVault] uploadUrl present:', Boolean(uploadUrl), 'file present:', Boolean(state.selectedFile));

      if (!uploadUrl) {
        throw new Error('Upload URL missing from upload response.');
      }

      console.debug('[SecureVault] Calling uploadToS3()', { uploadUrl, fileName: state.selectedFile.name, fileType: state.selectedFile.type });
      const s3UploadResult = await window.SecureVaultAPI.uploadToS3(uploadUrl, state.selectedFile);
      console.debug('[SecureVault] S3 PUT result', s3UploadResult);

      if (!s3UploadResult || s3UploadResult.success !== true) {
        throw new Error(s3UploadResult && s3UploadResult.message ? s3UploadResult.message : 'S3 upload failed.');
      }

      showToast('Success', 'Document uploaded successfully.', 'success');
      await loadData();
      resetUploadState();
    } catch (error) {
      showToast('Error', error.message || 'Upload failed.', 'error');
      if (dom.uploadButton) {
        dom.uploadButton.disabled = false;
        dom.uploadButton.textContent = 'Upload';
      }
      if (dom.cancelUploadButton) {
        dom.cancelUploadButton.disabled = false;
      }
    }
  }

  async function handleDownload(fileId) {
    try {
      const file = state.documents.find((item) => item.fileId === fileId);

      if (!file) {
        showToast('Error', 'File not found.', 'error');
        return;
      }

      const response = await window.SecureVaultAPI.downloadFile(fileId);

      if (!response || !response.success || !response.downloadUrl) {
        showToast(
          'Error',
          response?.message || 'Download link unavailable.',
          'error'
        );
        return;
      }

      console.log('[SecureVault] Download URL received');

      const fileResponse = await fetch(response.downloadUrl);

      if (!fileResponse.ok) {
        throw new Error('Unable to download file from S3.');
      }

      const blob = await fileResponse.blob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = file.fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      showToast('Success', 'File downloaded successfully.', 'success');

      await loadData(false);
    } catch (error) {
      console.error('[SecureVault] Download error:', error);
      showToast('Error', error.message || 'Download failed.', 'error');
    }
  }

  async function handleDelete(fileId) {
    console.log('[SecureVault] handleDelete START', fileId);

    try {
      const file = state.documents.find((item) => item.fileId === fileId);
      console.log('[SecureVault] file found', file);
      if (!file) {
        console.warn('[SecureVault] File not found in state.documents', fileId);
        showToast('Error', 'File not found.', 'error');
        return;
      }

      console.log('[SecureVault] showing delete confirmation');
      const confirmed = window.confirm(`Delete ${file.fileName}? This demo action can be reversed only by re-uploading the file.`);
      console.log('[SecureVault] confirmation result', confirmed);
      if (!confirmed) {
        console.log('[SecureVault] Delete cancelled by user', fileId);
        return;
      }

      console.log('[SecureVault] calling deleteFile', fileId);
      const response = await window.SecureVaultAPI.deleteFile(fileId);
      console.log('[SecureVault] deleteFile response', response);
      if (!response || !response.success) {
        showToast('Error', response?.message || 'Delete failed.', 'error');
        return;
      }

      showToast('Success', response.message || 'File deleted successfully.', 'success');
      await loadData();
    } catch (error) {
      console.error('[SecureVault] Delete error', error);
      showToast('Error', error.message || 'Delete failed.', 'error');
    }
  }

  async function handleDetails(fileId) {
    console.log('[SecureVault] View Details clicked', fileId);
    console.log('[SecureVault] View Details request started');

    try {
      const response = await window.SecureVaultAPI.getFile(fileId);
      console.log('[SecureVault] View Details response', response);

      if (!response || !response.success || !response.file) {
        showToast('Error', response?.message || 'File details unavailable.', 'error');
        return;
      }

      const file = response.file;
      console.log('[SecureVault] View Details file', file);

      state.detailsFileId = fileId;
      if (dom.detailsModal) {
        dom.detailsModal.removeAttribute('aria-hidden');
        dom.detailsModal.hidden = false;
      }

      renderDetailsModal(file);
    } catch (error) {
      console.error('[SecureVault] View Details error', error);
      showToast('Error', error.message || 'File details unavailable.', 'error');
    }
  }

  async function copyFileId(fileId) {
    try {
      await navigator.clipboard.writeText(fileId);
      showToast('Info', 'File ID copied to clipboard.', 'info');
    } catch (error) {
      showToast('Info', `File ID: ${fileId}`, 'info');
    }
  }

  function toggleMenu(fileId) {
    state.activeMenuId = state.activeMenuId === fileId ? null : fileId;
    renderDocuments();
  }

  function handleDocumentTableClick(event) {
    const target = event.target;
    const button = target.closest('[data-action]');

    if (!button || !dom.documentsTbody.contains(button)) {
      return;
    }

    const actionElement = button.closest('[data-action]') || button;
    const fileIdFromButton = actionElement.dataset.fileId || button.dataset.fileId;
    const fileId = button.dataset.fileId || fileIdFromButton;
    const { action } = button.dataset;

    if (action === 'menu') {
      event.stopPropagation();
      toggleMenu(fileId);
      return;
    }

    event.stopPropagation();
    state.activeMenuId = null;
    renderDocuments();

    if (action === 'download') {
      handleDownload(fileId);
      return;
    }

    if (action === 'details') {
      handleDetails(fileId);
      return;
    }

    if (action === 'delete') {
      console.log('[SecureVault] Delete action clicked', fileId);
      handleDelete(fileId);
      return;
    }

    if (action === 'copy-id') {
      copyFileId(fileId);
    }
  }

  function bindEvents() {
    if (dom.logoutButton) {
      dom.logoutButton.addEventListener('click', () => {
        window.SecureVaultAuth.logoutUser();
        window.location.href = 'index.html';
      });
    }

    if (dom.chooseFileButton && dom.uploadInput) {
      dom.chooseFileButton.addEventListener('click', () => dom.uploadInput.click());
    }

    if (dom.uploadInput) {
      dom.uploadInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        setSelectedFile(file);
      });
    }

    if (dom.uploadDropzone && dom.uploadInput) {
      dom.uploadDropzone.addEventListener('click', (event) => {
        if (event.target !== dom.chooseFileButton) {
          dom.uploadInput.click();
        }
      });

      dom.uploadDropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          dom.uploadInput.click();
        }
      });

      dom.uploadDropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dom.uploadDropzone.classList.add('is-dragover');
      });

      dom.uploadDropzone.addEventListener('dragleave', () => {
        dom.uploadDropzone.classList.remove('is-dragover');
      });

      dom.uploadDropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dom.uploadDropzone.classList.remove('is-dragover');
        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        setSelectedFile(file);
      });
    }

    if (dom.uploadButton) {
      dom.uploadButton.addEventListener('click', handleUpload);
    }

    if (dom.cancelUploadButton) {
      dom.cancelUploadButton.addEventListener('click', () => {
        if (state.uploadTimer) {
          window.clearInterval(state.uploadTimer);
          state.uploadTimer = null;
        }
        resetUploadState();
        showToast('Info', 'Upload cancelled.', 'info');
      });
    }

    if (dom.documentSearch) {
      dom.documentSearch.addEventListener('input', (event) => {
        state.documentSearch = event.target.value;
        renderDocuments();
      });
    }

    if (dom.documentFilter) {
      dom.documentFilter.addEventListener('change', (event) => {
        state.documentFilter = event.target.value;
        renderDocuments();
      });
    }

    if (dom.documentSort) {
      dom.documentSort.addEventListener('change', (event) => {
        state.documentSort = event.target.value;
        renderDocuments();
      });
    }

    if (dom.auditSearch) {
      dom.auditSearch.addEventListener('input', (event) => {
        state.auditSearch = event.target.value;
        state.auditVisibleCount = 5;
        renderAuditLogs();
      });
    }

    if (dom.auditActionFilter) {
      dom.auditActionFilter.addEventListener('change', (event) => {
        state.auditActionFilter = event.target.value;
        state.auditVisibleCount = 5;
        renderAuditLogs();
      });
    }

    if (dom.auditDateFilter) {
      dom.auditDateFilter.addEventListener('change', (event) => {
        state.auditDateFilter = event.target.value;
        state.auditVisibleCount = 5;
        renderAuditLogs();
      });
    }

    if (dom.loadMoreAuditButton) {
      dom.loadMoreAuditButton.addEventListener('click', () => {
        console.log('[SecureVault] Audit load requested');
        console.log('[SecureVault] Audit pagination state', {
          visibleCount: state.auditVisibleCount,
          totalLogs: state.auditLogs.length,
          filteredLogs: getFilteredAuditLogs().length
        });

        const currentLogs = getFilteredAuditLogs();
        if (currentLogs.length <= state.auditVisibleCount) {
          dom.loadMoreAuditButton.hidden = true;
          dom.loadMoreAuditButton.disabled = true;
          return;
        }

        state.auditVisibleCount = Math.min(state.auditVisibleCount + 5, currentLogs.length);
        renderAuditLogs();
      });
    }

    if (dom.documentsTbody) {
      dom.documentsTbody.addEventListener('click', handleDocumentTableClick);
    }

    if (dom.closeDetailsButton) {
      dom.closeDetailsButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeDetailsModal();
      });
    }

    if (dom.detailsModal) {
      dom.detailsModal.addEventListener('click', (event) => {
        if (event.target === dom.detailsModal) {
          closeDetailsModal();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dom.detailsModal && !dom.detailsModal.hidden) {
        closeDetailsModal();
      }
    });

    window.addEventListener('click', () => {
      if (state.activeMenuId) {
        state.activeMenuId = null;
        renderDocuments();
      }
    });
  }

  async function loadData(showLoading = true) {
    if (showLoading) {
      setPageLoading(true);
    }

    try {
      console.log('[SecureVault] Audit load requested');
      const [filesResponse, auditResponse, statsResponse] = await Promise.all([
        window.SecureVaultAPI.getFiles(),
        window.SecureVaultAPI.getAuditLogs(),
        window.SecureVaultAPI.getDashboardStats()
      ]);

      console.log('[SecureVault] Audit response', auditResponse);

      state.documents = filesResponse.files || [];
      state.auditLogs = Array.isArray(auditResponse && auditResponse.logs) ? auditResponse.logs : [];
      state.auditVisibleCount = 5;
      console.log('[SecureVault] Audit logs count', state.auditLogs.length);

      renderSummaryCards((statsResponse && statsResponse.stats) || {
        totalDocuments: state.documents.length,
        storageUsed: state.documents.reduce((sum, file) => sum + Number(file.size || 0), 0),
        recentAccesses: state.auditLogs.length,
        securityStatus: 'Protected'
      });
      renderDocuments();
      renderAuditLogs();
    } catch (error) {
      showToast('Error', 'Unable to load demo data.', 'error');
    } finally {
      if (showLoading) {
        window.setTimeout(() => setPageLoading(false), 350);
      }
    }
  }

  async function init() {
    dom = {
      pageLoading: document.getElementById('pageLoading'),
      topbarUser: document.getElementById('topbarUser'),
      welcomeUser: document.getElementById('welcomeUser'),
      topbarSecurity: document.getElementById('topbarSecurity'),
      logoutButton: document.getElementById('logoutButton'),
      summaryCards: document.getElementById('summaryCards'),
      uploadDropzone: document.getElementById('uploadDropzone'),
      uploadInput: document.getElementById('uploadInput'),
      chooseFileButton: document.getElementById('chooseFileButton'),
      selectedFileName: document.getElementById('selectedFileName'),
      selectedFileSize: document.getElementById('selectedFileSize'),
      uploadError: document.getElementById('uploadError'),
      uploadProgressBar: document.getElementById('uploadProgressBar'),
      uploadButton: document.getElementById('uploadButton'),
      cancelUploadButton: document.getElementById('cancelUploadButton'),
      documentSearch: document.getElementById('documentSearch'),
      documentFilter: document.getElementById('documentFilter'),
      documentSort: document.getElementById('documentSort'),
      documentsTbody: document.getElementById('documentsTbody'),
      documentsEmptyState: document.getElementById('documentsEmptyState'),
      documentsCount: document.getElementById('documentsCount'),
      auditSearch: document.getElementById('auditSearch'),
      auditActionFilter: document.getElementById('auditActionFilter'),
      auditDateFilter: document.getElementById('auditDateFilter'),
      auditTbody: document.getElementById('auditTbody'),
      auditEmptyState: document.getElementById('auditEmptyState'),
      auditCount: document.getElementById('auditCount'),
      loadMoreAuditButton: document.getElementById('loadMoreAuditButton'),
      detailsModal: document.getElementById('detailsModal'),
      detailsContent: document.getElementById('detailsContent'),
      closeDetailsButton: document.getElementById('closeDetailsButton'),
      toastContainer: document.getElementById('toastContainer')
    };

    if (!(await window.SecureVaultAuth.isAuthenticated())) {
      window.location.href = 'index.html';
      return;
    }

    state.user = window.SecureVaultAuth.getCurrentUser();

    if (dom.topbarUser && state.user) {
      dom.topbarUser.textContent = state.user.email;
    }
    if (dom.welcomeUser && state.user) {
      dom.welcomeUser.textContent = state.user.email;
    }

    if (dom.topbarSecurity) {
      dom.topbarSecurity.textContent = 'COGNITO';
    }

    bindEvents();
    await loadData(true);
    showToast('Security', 'Authenticated Cognito session loaded.', 'security');
  }

  window.addEventListener('DOMContentLoaded', init);
})(window);