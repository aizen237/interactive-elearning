import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkUploadModal from './BulkUploadModal';
import adminAPI from '../../services/adminAPI';

// Mock adminAPI
vi.mock('../../services/adminAPI', () => ({
  default: {
    bulkCreateUsers: vi.fn()
  }
}));

describe('BulkUploadModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Modal renders with correct structure
   * Requirements: 7.2
   */
  it('should render modal with title and close button', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Bulk User Upload')).toBeInTheDocument();
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    expect(screen.getByText('Select CSV File')).toBeInTheDocument();
  });

  /**
   * Test: Display format instructions
   * Requirements: 7.3
   */
  it('should display CSV format instructions', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('📋 CSV Format Instructions')).toBeInTheDocument();
    expect(screen.getByText(/full_name, email, password, role/)).toBeInTheDocument();
    expect(screen.getByText(/Valid roles:/)).toBeInTheDocument();
    expect(screen.getByText(/Student, Parent, Teacher, Admin/)).toBeInTheDocument();
  });

  /**
   * Test: File input accepts CSV files
   * Requirements: 7.3
   */
  it('should accept CSV file selection', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(['full_name,email,password,role\nJohn,john@test.com,pass123,Student'], 'test.csv', {
      type: 'text/csv'
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Selected: test.csv/)).toBeInTheDocument();
  });

  /**
   * Test: Validate CSV file type
   * Requirements: 7.4
   */
  it('should reject non-CSV files', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('Please select a CSV file')).toBeInTheDocument();
  });

  /**
   * Test: Validate file size
   * Requirements: 7.4
   */
  it('should reject files larger than 5MB', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    // Create a file larger than 5MB
    const largeContent = 'a'.repeat(6 * 1024 * 1024);
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
  });

  /**
   * Test: Upload button disabled without file
   * Requirements: 7.5
   */
  it('should disable upload button when no file is selected', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    expect(uploadButton).toBeDisabled();
  });

  /**
   * Test: Display upload progress indicator
   * Requirements: 7.6
   */
  it('should display progress indicator during upload', async () => {
    // Mock API to delay response
    adminAPI.bulkCreateUsers.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        data: {
          success: true,
          data: { total: 1, successful: 1, failed: 0, errors: [] }
        }
      }), 100))
    );

    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(
      ['full_name,email,password,role\nJohn Doe,john@test.com,pass123,Student'],
      'test.csv',
      { type: 'text/csv' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadButton);

    // Check for progress indicator
    await waitFor(() => {
      expect(screen.getByText('Uploading and processing users...')).toBeInTheDocument();
    });
  });

  /**
   * Test: Display results summary after successful upload
   * Requirements: 7.7
   */
  it('should display results summary with success/failure counts', async () => {
    adminAPI.bulkCreateUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          total: 3,
          successful: 2,
          failed: 1,
          errors: [
            { row: 3, email: 'invalid@test.com', error: 'Duplicate email' }
          ]
        }
      }
    });

    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(
      ['full_name,email,password,role\nJohn,john@test.com,pass123,Student\nJane,jane@test.com,pass456,Parent\nBob,invalid@test.com,pass789,Student'],
      'test.csv',
      { type: 'text/csv' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Upload Complete')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total
      expect(screen.getByText('2')).toBeInTheDocument(); // Successful
      expect(screen.getByText('1')).toBeInTheDocument(); // Failed
    });
  });

  /**
   * Test: Display detailed error list for failed users
   * Requirements: 7.8
   */
  it('should display detailed error list for failed users', async () => {
    adminAPI.bulkCreateUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          total: 2,
          successful: 1,
          failed: 1,
          errors: [
            { row: 2, email: 'duplicate@test.com', error: 'Email already exists' }
          ]
        }
      }
    });

    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(
      ['full_name,email,password,role\nJohn,john@test.com,pass123,Student\nJane,duplicate@test.com,pass456,Parent'],
      'test.csv',
      { type: 'text/csv' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Failed Users')).toBeInTheDocument();
      expect(screen.getByText(/Row 2:/)).toBeInTheDocument();
      expect(screen.getByText(/duplicate@test.com/)).toBeInTheDocument();
      expect(screen.getByText(/Email already exists/)).toBeInTheDocument();
    });
  });

  /**
   * Test: Upload button should be enabled when file is selected
   * Requirements: 7.5
   */
  it('should enable upload button when valid file is selected', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const file = new File(
      ['full_name,email,password,role\nJohn,john@test.com,pass123,Student'],
      'test.csv',
      { type: 'text/csv' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    expect(uploadButton).not.toBeDisabled();
  });

  /**
   * Test: Display results summary structure
   * Requirements: 7.7
   */
  it('should have proper structure for displaying results', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Modal should have the necessary structure for displaying results
    expect(screen.getByText('Bulk User Upload')).toBeInTheDocument();
    expect(screen.getByText('📋 CSV Format Instructions')).toBeInTheDocument();
  });

  /**
   * Test: Close modal on backdrop click
   */
  it('should close modal when backdrop is clicked', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const backdrop = screen.getByRole('button', { name: 'Close modal' }).closest('.fixed');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Close modal on close button click
   */
  it('should close modal when close button is clicked', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Modal structure supports progress indication
   * Requirements: 7.6
   */
  it('should have structure for displaying upload progress', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Modal should have proper structure
    expect(screen.getByText('Bulk User Upload')).toBeInTheDocument();
    expect(screen.getByLabelText('Select CSV File')).toBeInTheDocument();
  });

  /**
   * Test: CSV format instructions are displayed
   * Requirements: 7.4
   */
  it('should display CSV format requirements', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Check that format instructions are present
    expect(screen.getByText('📋 CSV Format Instructions')).toBeInTheDocument();
    expect(screen.getByText(/full_name, email, password, role/)).toBeInTheDocument();
    expect(screen.getByText(/Valid roles:/)).toBeInTheDocument();
  });

  /**
   * Test: Display file size in KB
   */
  it('should display selected file size in KB', () => {
    render(<BulkUploadModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const fileInput = screen.getByLabelText('Select CSV File');
    const content = 'full_name,email,password,role\nJohn,john@test.com,pass123,Student';
    const file = new File([content], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    const sizeInKB = (content.length / 1024).toFixed(2);
    expect(screen.getByText(new RegExp(`${sizeInKB} KB`))).toBeInTheDocument();
  });
});
