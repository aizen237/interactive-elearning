import { useState } from 'react';
import adminAPI from '../../services/adminAPI';

/**
 * BulkUploadModal Component
 * 
 * Modal interface for bulk user upload via CSV file.
 * Provides file selection, format validation, upload progress, and results display.
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSuccess - Callback after successful upload
 */
function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [validationError, setValidationError] = useState('');

  /**
   * Handle file selection
   * Requirements: 7.3
   */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setValidationError('');
    setResults(null);
    setErrors([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setValidationError('Please select a CSV file');
      setFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setValidationError('File size must be less than 5MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  /**
   * Validate CSV format by reading first few lines
   * Requirements: 7.4
   */
  const validateCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject('CSV file must contain a header row and at least one data row');
          return;
        }

        // Check header row
        const header = lines[0].toLowerCase().trim();
        const requiredColumns = ['full_name', 'email', 'password', 'role'];
        const hasAllColumns = requiredColumns.every(col => 
          header.includes(col.replace('_', ' ')) || header.includes(col)
        );

        if (!hasAllColumns) {
          reject(`CSV must contain columns: ${requiredColumns.join(', ')}`);
          return;
        }

        resolve();
      };

      reader.onerror = () => {
        reject('Failed to read file');
      };

      reader.readAsText(file);
    });
  };

  /**
   * Handle file upload
   * Requirements: 7.5, 7.6, 7.7, 7.8
   */
  const handleUpload = async () => {
    if (!file) {
      setValidationError('Please select a file');
      return;
    }

    try {
      // Validate CSV format before upload
      setUploading(true);
      setValidationError('');
      await validateCSV(file);

      // Create FormData and upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await adminAPI.bulkCreateUsers(formData);

      if (response.data.success) {
        const data = response.data.data;
        setResults({
          total: data.total || 0,
          successful: data.successful || 0,
          failed: data.failed || 0
        });
        setErrors(data.errors || []);

        // Call success callback if all users were created successfully
        if (data.failed === 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setValidationError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      if (typeof err === 'string') {
        setValidationError(err);
      } else {
        setValidationError(err.response?.data?.message || 'Failed to upload file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Bulk User Upload</h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-white hover:text-gray-200 text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Format Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 CSV Format Instructions</h3>
            <p className="text-sm text-blue-800 mb-2">
              Your CSV file must contain the following columns in order:
            </p>
            <div className="bg-white rounded p-3 font-mono text-sm text-gray-700 mb-2">
              full_name, email, password, role
            </div>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Valid roles:</strong> Student, Parent, Teacher, Admin
            </p>
            <p className="text-sm text-blue-800">
              <strong>Example:</strong>
            </p>
            <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 mt-2">
              full_name,email,password,role<br />
              John Doe,john@example.com,password123,Student<br />
              Jane Smith,jane@example.com,password456,Parent
            </div>
          </div>

          {/* File Input */}
          {!results && (
            <div className="mb-6">
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {validationError}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <p className="text-purple-800 font-medium">Uploading and processing users...</p>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 mb-3">✅ Upload Complete</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{results.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-3">❌ Failed Users</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-800 bg-white rounded p-2">
                          <strong>Row {error.row || index + 2}:</strong> {error.email || 'Unknown'} - {error.error || error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkUploadModal;
