(function (window) {
  const DEFAULT_ALLOWED_TYPES = ['PDF', 'DOC', 'DOCX', 'TXT', 'PNG', 'JPG'];
  const config = window.SECUREVAULT_CONFIG || {};
  let apiEndpoint = String(config.apiEndpoint || '').replace(/\/$/, '');

  const localState = {
    nextFileNumber: 4,
    files: [
      {
        fileId: 'file-001',
        fileName: 'annual-report.pdf',
        fileType: 'PDF',
        size: 2400000,
        uploadedAt: '2026-08-21T10:32:00Z',
        status: 'Encrypted'
      },
      {
        fileId: 'file-002',
        fileName: 'project-report.docx',
        fileType: 'DOCX',
        size: 1800000,
        uploadedAt: '2026-08-20T14:05:00Z',
        status: 'Encrypted'
      },
      {
        fileId: 'file-003',
        fileName: 'certificate.pdf',
        fileType: 'PDF',
        size: 850000,
        uploadedAt: '2026-08-18T08:12:00Z',
        status: 'Encrypted'
      }
    ],
    auditLogs: [
      {
        logId: 'log-001',
        fileId: 'file-001',
        fileName: 'annual-report.pdf',
        action: 'UPLOAD',
        user: 'demo@securevault.local',
        dateTime: '2026-08-21T10:32:00Z',
        ipAddress: '192.168.1.10',
        status: 'Success'
      },
      {
        logId: 'log-002',
        fileId: 'file-001',
        fileName: 'annual-report.pdf',
        action: 'DOWNLOAD',
        user: 'demo@securevault.local',
        dateTime: '2026-08-21T11:05:00Z',
        ipAddress: '192.168.1.10',
        status: 'Success'
      },
      {
        logId: 'log-003',
        fileId: 'file-003',
        fileName: 'certificate.pdf',
        action: 'VIEW',
        user: 'demo@securevault.local',
        dateTime: '2026-08-20T18:21:00Z',
        ipAddress: '192.168.1.10',
        status: 'Success'
      },
      {
        logId: 'log-004',
        fileId: 'file-002',
        fileName: 'project-report.docx',
        action: 'UPLOAD',
        user: 'demo@securevault.local',
        dateTime: '2026-08-20T14:05:00Z',
        ipAddress: '192.168.1.10',
        status: 'Success'
      }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function delay(result, wait = 180) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(clone(result)), wait);
    });
  }

  function supportsLiveApi() {
    return window.location.protocol !== 'file:';
  }

  async function request(path, options = {}) {
    if (!supportsLiveApi() || !apiEndpoint || apiEndpoint.includes('__API_ENDPOINT__')) {
      throw new Error('Live API unavailable in file mode');
    }

    const response = await fetch(`${apiEndpoint}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || 'Request failed');
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  function getFileTypeFromName(fileName) {
    const extension = String(fileName || '').split('.').pop().toUpperCase();
    if (['PDF', 'DOC', 'DOCX', 'TXT', 'PNG', 'JPG', 'JPEG'].includes(extension)) {
      return extension === 'JPEG' ? 'JPG' : extension;
    }
    return 'OTHER';
  }

  function createFileId() {
    const next = String(localState.nextFileNumber).padStart(3, '0');
    localState.nextFileNumber += 1;
    return `file-${next}`;
  }

  function createLogId() {
    return `log-${String(localState.auditLogs.length + 1).padStart(3, '0')}`;
  }

  function addAuditLog(entry) {
    localState.auditLogs.unshift({
      logId: createLogId(),
      ipAddress: '192.168.1.10',
      status: 'Success',
      user: 'demo@securevault.local',
      ...entry
    });
  }

  function calculateStats() {
    const totalStorage = localState.files.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const recentAccesses = localState.auditLogs.filter((entry) => {
      const entryDate = new Date(entry.dateTime);
      const now = new Date();
      const delta = now.getTime() - entryDate.getTime();
      return delta <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      success: true,
      stats: {
        totalDocuments: localState.files.length,
        storageUsed: totalStorage,
        recentAccesses,
        securityStatus: 'Protected'
      }
    };
  }

  async function getFiles() {
    try {
      return await request('/api/files');
    } catch (error) {
      if (error.status) throw error;
      return delay({ success: true, files: localState.files });
    }
  }

  async function getFile(fileId) {
    try {
      return await request(`/api/files/${encodeURIComponent(fileId)}`);
    } catch (error) {
      if (error.status) throw error;
      const file = localState.files.find((item) => item.fileId === fileId);
      return delay({ success: Boolean(file), file: file || null });
    }
  }

  async function downloadFile(fileId) {
    try {
      return await request(`/api/files/${encodeURIComponent(fileId)}/download`);
    } catch (error) {
      if (error.status) throw error;
      const file = localState.files.find((item) => item.fileId === fileId);
      if (file) {
        addAuditLog({
          fileId: file.fileId,
          fileName: file.fileName,
          action: 'DOWNLOAD',
          dateTime: new Date().toISOString()
        });
      }
      return delay({
        success: Boolean(file),
        message: file ? 'Download link generated.' : 'File not found.'
      });
    }
  }

  async function uploadFile(payload) {
    try {
      return await request('/api/files/upload', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (error.status) throw error;
      const fileName = payload.fileName || 'untitled.txt';
      const fileType = payload.fileType || getFileTypeFromName(fileName);
      const size = Number(payload.size || 0);
      const file = {
        fileId: createFileId(),
        fileName,
        fileType,
        size,
        uploadedAt: new Date().toISOString(),
        status: 'Encrypted'
      };

      localState.files.unshift(file);
      addAuditLog({
        fileId: file.fileId,
        fileName: file.fileName,
        action: 'UPLOAD',
        dateTime: file.uploadedAt
      });

      return delay({ success: true, file, message: 'Document uploaded successfully.' });
    }
  }

  async function deleteFile(fileId) {
    try {
      return await request(`/api/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE'
      });
    } catch (error) {
      if (error.status) throw error;
      const fileIndex = localState.files.findIndex((item) => item.fileId === fileId);
      if (fileIndex === -1) {
        return delay({ success: false, message: 'File not found.' });
      }

      const [removedFile] = localState.files.splice(fileIndex, 1);
      addAuditLog({
        fileId: removedFile.fileId,
        fileName: removedFile.fileName,
        action: 'DELETE',
        dateTime: new Date().toISOString(),
        status: 'Success'
      });

      return delay({ success: true, message: 'File deleted successfully.' });
    }
  }

  async function getAuditLogs() {
    try {
      return await request('/api/audit-logs');
    } catch (error) {
      if (error.status) throw error;
      return delay({ success: true, logs: localState.auditLogs });
    }
  }

  async function getAuditLogsForFile(fileId) {
    try {
      return await request(`/api/audit-logs/${encodeURIComponent(fileId)}`);
    } catch (error) {
      if (error.status) throw error;
      const logs = localState.auditLogs.filter((entry) => entry.fileId === fileId);
      return delay({ success: true, logs });
    }
  }

  async function getDashboardStats() {
    try {
      const [filesResponse, auditResponse] = await Promise.all([
        getFiles(),
        getAuditLogs()
      ]);

      const files = filesResponse.files || [];
      const logs = auditResponse.logs || [];
      const totalStorage = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
      const recentAccesses = logs.filter((entry) => {
        const entryDate = new Date(entry.dateTime);
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
    } catch (error) {
      return calculateStats();
    }
  }

  window.SecureVaultAPI = {
    getFiles,
    getFile,
    downloadFile,
    uploadFile,
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