(function (window) {
  const DEFAULT_ALLOWED_TYPES = ['PDF', 'DOC', 'DOCX', 'TXT', 'PNG', 'JPG'];
  const config = window.SECUREVAULT_CONFIG || {};
  let apiEndpoint = String(config.apiEndpoint || '').replace(/\/$/, '');

  function supportsLiveApi() {
    return window.location.protocol !== 'file:';
  }

  function getConfiguredApiEndpoint() {
    if (!supportsLiveApi()) {
      throw new Error('Live API requests are unavailable in file mode. Use a local HTTP server.');
    }

    if (!apiEndpoint || apiEndpoint.includes('__API_ENDPOINT__')) {
      throw new Error('SecureVault API endpoint is not configured.');
    }

    return apiEndpoint;
  }

  async function getAuthHeaders() {
    if (!window.SecureVaultAuth || typeof window.SecureVaultAuth.getIdToken !== 'function') {
      throw new Error('SecureVaultAuth.getIdToken() is not available.');
    }

    const token = await window.SecureVaultAuth.getIdToken();
    if (!token) {
      throw new Error('No Cognito ID token is available for this request.');
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  async function request(path, options = {}) {
    console.log('[SecureVaultAPI] request start', { path, method: options.method || 'GET' });

    try {
      const endpoint = getConfiguredApiEndpoint();
      const authHeaders = await getAuthHeaders();
      console.log('[SecureVaultAPI] fetch invoking', `${endpoint}${path}`);
      const response = await fetch(`${endpoint}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(options.headers || {})
        },
        ...options
      });

      let payload = {};
      const responseText = await response.text();
      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch (error) {
          payload = { message: responseText };
        }
      }

      console.log('[SecureVaultAPI] fetch response', { status: response.status, ok: response.ok, payload });

      if (!response.ok) {
        const error = new Error((payload && (payload.message || payload.error)) || 'Request failed');
        error.status = response.status;
        error.response = payload;
        throw error;
      }

      return payload;
    } catch (error) {
      console.error('[SecureVaultAPI] request error', error);
      throw error;
    }
  }

  function getFileTypeFromName(fileName) {
    const extension = String(fileName || '').split('.').pop().toUpperCase();
    if (['PDF', 'DOC', 'DOCX', 'TXT', 'PNG', 'JPG', 'JPEG'].includes(extension)) {
      return extension === 'JPEG' ? 'JPG' : extension;
    }
    return 'OTHER';
  }

  async function getFiles() {
    return request('/files');
  }

  async function getAuditLogs() {
    return request('/audit');
  }

  async function downloadFile(fileId) {
    return request(`/download/${encodeURIComponent(fileId)}`);
  }

  async function uploadFile(payload) {
    return request('/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function uploadToS3(uploadUrl, file) {
    if (!uploadUrl) {
      throw new Error('Upload URL is missing from the API response.');
    }

    if (!file || typeof file !== 'object' || typeof file.name === 'undefined') {
      throw new Error('A valid file object is required for the S3 upload.');
    }

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'S3 upload failed.');
    }

    return { success: true, message: 'S3 upload completed successfully.' };
  }

  async function getFile(fileId) {
    if (!fileId) {
      const error = new Error('A valid fileId is required for GET /files/{fileId}.');
      error.status = 400;
      throw error;
    }

    return request(`/files/${encodeURIComponent(fileId)}`);
  }

  async function deleteFile(fileId) {
    console.log('[SecureVaultAPI] deleteFile called', fileId);

    if (!fileId) {
      const error = new Error('A valid fileId is required for DELETE /files/{fileId}.');
      console.error('[SecureVaultAPI] invalid deleteFile fileId', fileId);
      return {
        success: false,
        message: error.message
      };
    }

    console.log('[SecureVaultAPI] sending DELETE request', fileId);
    const response = await request(`/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE'
    });
    console.log('[SecureVaultAPI] DELETE response', response);
    return response;
  }

  async function getAuditLogsForFile(fileId) {
    return {
      success: false,
      supported: false,
      message: `Unsupported API method: GET /audit/${encodeURIComponent(fileId)} is not currently deployed.`
    };
  }

  async function getDashboardStats() {
    const [filesResponse, auditResponse] = await Promise.all([
      getFiles(),
      getAuditLogs()
    ]);

    const files = Array.isArray(filesResponse && filesResponse.files) ? filesResponse.files : [];
    const logs = Array.isArray(auditResponse && auditResponse.logs) ? auditResponse.logs : [];
    const totalStorage = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const recentAccesses = logs.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      return now.getTime() - entryDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      success: true,
      stats: {
        totalDocuments: files.length,
        storageUsed: totalStorage,
        recentAccesses,
        securityStatus: 'Protected'
      }
    };
  }

  window.SecureVaultAPI = {
    getFiles,
    getFile,
    downloadFile,
    uploadFile,
    uploadToS3,
    deleteFile,
    getAuditLogs,
    getAuditLogsForFile,
    getDashboardStats,
    getFileTypeFromName,
    allowedTypes: DEFAULT_ALLOWED_TYPES,
    setBaseUrl: function (url) {
      apiEndpoint = String(url || '').replace(/\/$/, '');
    },
    request
  };
})(window);