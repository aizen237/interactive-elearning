const adminController = require('../src/controllers/adminController');
const Module = require('../src/models/Module');
const db = require('../src/config/db');

/**
 * Unit Tests for Admin Controller - Content Management Endpoints
 * Tests controller logic for module CRUD operations with mocked database calls
 * 
 * **Validates: Requirements 8.1, 9.5, 10.4, 11.3**
 */

// Mock dependencies
jest.mock('../src/models/Module');
jest.mock('../src/config/db');

describe('Admin Controller - Content Management Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, role: 'Admin' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getModules', () => {
    it('should return all modules without search filter', async () => {
      // Setup: Mock database response
      const mockModules = [
        { id: 1, name: 'Module 1', description: 'Description 1', is_locked: 0, created_at: '2024-01-01' },
        { id: 2, name: 'Module 2', description: 'Description 2', is_locked: 0, created_at: '2024-01-02' }
      ];
      
      db.execute
        .mockResolvedValueOnce([mockModules]) // getModules query
        .mockResolvedValueOnce([[{ count: 5 }]]) // content count for module 1
        .mockResolvedValueOnce([[{ count: 3 }]]); // content count for module 2

      // Test: Call getModules
      await adminController.getModules(req, res);

      // Verify: Database query called correctly
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT id, module_name as name, description, is_locked, created_at FROM modules ORDER BY id ASC',
        []
      );

      // Verify: Content count queries called for each module
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
        [1]
      );
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
        [2]
      );

      // Verify: Response formatted correctly
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Modules retrieved successfully',
        data: [
          { ...mockModules[0], item_count: 5 },
          { ...mockModules[1], item_count: 3 }
        ]
      });
    });

    it('should filter modules by search query', async () => {
      // Setup: Request with search query
      req.query = { search: 'Math' };
      const mockModules = [
        { id: 1, name: 'Mathematics', description: 'Math module', is_locked: 0, created_at: '2024-01-01' }
      ];
      
      db.execute
        .mockResolvedValueOnce([mockModules])
        .mockResolvedValueOnce([[{ count: 10 }]]);

      // Test: Call getModules with search
      await adminController.getModules(req, res);

      // Verify: Search filter applied in query
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT id, module_name as name, description, is_locked, created_at FROM modules WHERE module_name LIKE ? ORDER BY id ASC',
        ['%Math%']
      );

      // Verify: Response includes filtered results
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Modules retrieved successfully',
        data: [{ ...mockModules[0], item_count: 10 }]
      });
    });

    it('should return empty array when no modules found', async () => {
      // Setup: No modules in database
      db.execute.mockResolvedValueOnce([[]]);

      // Test: Call getModules
      await adminController.getModules(req, res);

      // Verify: Empty array returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Modules retrieved successfully',
        data: []
      });
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Mock database error
      const dbError = new Error('Database connection failed');
      db.execute.mockRejectedValue(dbError);

      // Test: Call getModules
      await adminController.getModules(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching modules',
        error: 'Database connection failed'
      });
    });
  });

  describe('createModule', () => {
    it('should create module with valid data', async () => {
      // Setup: Valid module data
      req.body = {
        name: 'New Module',
        description: 'Module description',
        level_requirement: 5
      };

      const mockCreatedModule = {
        module_id: 100,
        title: 'New Module',
        description: 'Module description',
        is_locked: 0
      };

      Module.create.mockResolvedValue(mockCreatedModule);

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Module.create called with correct data
      expect(Module.create).toHaveBeenCalledWith({
        title: 'New Module',
        description: 'Module description'
      });

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Module created successfully',
        data: {
          id: 100,
          name: 'New Module',
          description: 'Module description',
          is_locked: 0,
          item_count: 0
        }
      });
    });

    it('should create module without description', async () => {
      // Setup: Module data without description
      req.body = {
        name: 'New Module',
        level_requirement: 3
      };

      Module.create.mockResolvedValue({
        module_id: 101,
        title: 'New Module',
        description: null,
        is_locked: 0
      });

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Module created with null description
      expect(Module.create).toHaveBeenCalledWith({
        title: 'New Module',
        description: null
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should validate required name field', async () => {
      // Setup: Missing name
      req.body = {
        description: 'Description only'
      };

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Module name is required'
      });
      expect(Module.create).not.toHaveBeenCalled();
    });

    it('should validate empty name field', async () => {
      // Setup: Empty name
      req.body = {
        name: '   ',
        description: 'Description'
      };

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Module name is required'
      });
      expect(Module.create).not.toHaveBeenCalled();
    });

    it('should validate level_requirement is positive integer', async () => {
      // Setup: Negative level_requirement
      req.body = {
        name: 'New Module',
        level_requirement: -5
      };

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Level requirement must be a positive integer'
      });
      expect(Module.create).not.toHaveBeenCalled();
    });

    it('should validate level_requirement is a number', async () => {
      // Setup: Non-numeric level_requirement
      req.body = {
        name: 'New Module',
        level_requirement: 'invalid'
      };

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Level requirement must be a positive integer'
      });
      expect(Module.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      // Setup: Valid data but database error
      req.body = {
        name: 'New Module',
        description: 'Description'
      };

      const dbError = new Error('Database insert failed');
      Module.create.mockRejectedValue(dbError);

      // Test: Call createModule
      await adminController.createModule(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating module',
        error: 'Database insert failed'
      });
    });
  });

  describe('updateModule', () => {
    it('should update module with valid data', async () => {
      // Setup: Valid update data
      req.params = { moduleId: '10' };
      req.body = {
        name: 'Updated Module',
        description: 'Updated description'
      };

      const existingModule = {
        module_id: 10,
        title: 'Old Module',
        description: 'Old description',
        is_locked: 0
      };

      const updatedModule = {
        module_id: 10,
        title: 'Updated Module',
        description: 'Updated description',
        is_locked: 0
      };

      Module.findById.mockResolvedValue(existingModule);
      Module.update.mockResolvedValue(true);
      Module.findById.mockResolvedValueOnce(existingModule).mockResolvedValueOnce(updatedModule);
      db.execute.mockResolvedValue([[{ count: 7 }]]);

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Module.update called with correct data
      expect(Module.update).toHaveBeenCalledWith(10, {
        title: 'Updated Module',
        description: 'Updated description'
      });

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Module updated successfully',
        data: {
          id: 10,
          name: 'Updated Module',
          description: 'Updated description',
          is_locked: 0,
          item_count: 7
        }
      });
    });

    it('should update only name field', async () => {
      // Setup: Update only name
      req.params = { moduleId: '10' };
      req.body = {
        name: 'Updated Name Only'
      };

      Module.findById.mockResolvedValue({ module_id: 10, title: 'Old Name' });
      Module.update.mockResolvedValue(true);
      Module.findById.mockResolvedValueOnce({ module_id: 10 }).mockResolvedValueOnce({ module_id: 10, title: 'Updated Name Only' });
      db.execute.mockResolvedValue([[{ count: 5 }]]);

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Only title updated
      expect(Module.update).toHaveBeenCalledWith(10, {
        title: 'Updated Name Only'
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when module not found', async () => {
      // Setup: Module doesn't exist
      req.params = { moduleId: '999' };
      req.body = { name: 'Updated Name' };
      Module.findById.mockResolvedValue(null);

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Module not found'
      });
      expect(Module.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid module ID', async () => {
      // Setup: Invalid module ID
      req.params = { moduleId: 'invalid' };
      req.body = { name: 'Updated Name' };

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: 400 response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid module ID is required'
      });
      expect(Module.findById).not.toHaveBeenCalled();
    });

    it('should validate name is not empty', async () => {
      // Setup: Empty name
      req.params = { moduleId: '10' };
      req.body = { name: '   ' };
      Module.findById.mockResolvedValue({ module_id: 10 });

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Module name cannot be empty'
      });
      expect(Module.update).not.toHaveBeenCalled();
    });

    it('should validate level_requirement is positive integer', async () => {
      // Setup: Negative level_requirement
      req.params = { moduleId: '10' };
      req.body = {
        name: 'Updated Module',
        level_requirement: -3
      };
      Module.findById.mockResolvedValue({ module_id: 10 });

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Level requirement must be a positive integer'
      });
      expect(Module.update).not.toHaveBeenCalled();
    });

    it('should return 400 when no fields to update', async () => {
      // Setup: Empty update body
      req.params = { moduleId: '10' };
      req.body = {};
      Module.findById.mockResolvedValue({ module_id: 10 });

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No valid fields to update'
      });
      expect(Module.update).not.toHaveBeenCalled();
    });

    it('should handle update failure', async () => {
      // Setup: Update returns false
      req.params = { moduleId: '10' };
      req.body = { name: 'Updated Name' };
      Module.findById.mockResolvedValue({ module_id: 10 });
      Module.update.mockResolvedValue(false);

      // Test: Call updateModule
      await adminController.updateModule(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update module'
      });
    });
  });

  describe('deleteModule', () => {
    it('should delete module when no constraints exist', async () => {
      // Setup: Valid module with no content or progress
      req.params = { moduleId: '10' };

      Module.findById.mockResolvedValue({
        module_id: 10,
        title: 'Module to Delete'
      });

      db.execute
        .mockResolvedValueOnce([[{ count: 0 }]]) // No content items
        .mockResolvedValueOnce([[{ count: 0 }]]); // No student progress

      Module.delete.mockResolvedValue(true);

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: Constraint checks performed
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
        ['10']
      );
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM student_progress WHERE module_id = ?',
        ['10']
      );

      // Verify: Module.delete called
      expect(Module.delete).toHaveBeenCalledWith(10);

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Module deleted successfully',
        data: { moduleId: 10 }
      });
    });

    it('should prevent deletion when content items exist', async () => {
      // Setup: Module with content items
      req.params = { moduleId: '10' };

      Module.findById.mockResolvedValue({ module_id: 10 });
      db.execute.mockResolvedValueOnce([[{ count: 5 }]]); // 5 content items

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: Constraint error returned
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete module: 5 content item(s) are associated with this module. Please delete the content items first.'
      });
      expect(Module.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion when student progress exists', async () => {
      // Setup: Module with student progress
      req.params = { moduleId: '10' };

      Module.findById.mockResolvedValue({ module_id: 10 });
      db.execute
        .mockResolvedValueOnce([[{ count: 0 }]]) // No content items
        .mockResolvedValueOnce([[{ count: 3 }]]); // 3 student progress records

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: Constraint error returned
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete module: 3 student progress record(s) are associated with this module. Deleting would result in data loss.'
      });
      expect(Module.delete).not.toHaveBeenCalled();
    });

    it('should return 404 when module not found', async () => {
      // Setup: Module doesn't exist
      req.params = { moduleId: '999' };
      Module.findById.mockResolvedValue(null);

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Module not found'
      });
      expect(db.execute).not.toHaveBeenCalled();
      expect(Module.delete).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid module ID', async () => {
      // Setup: Invalid module ID
      req.params = { moduleId: 'invalid' };

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: 400 response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid module ID is required'
      });
      expect(Module.findById).not.toHaveBeenCalled();
    });

    it('should handle deletion failure', async () => {
      // Setup: Delete returns false
      req.params = { moduleId: '10' };

      Module.findById.mockResolvedValue({ module_id: 10 });
      db.execute
        .mockResolvedValueOnce([[{ count: 0 }]])
        .mockResolvedValueOnce([[{ count: 0 }]]);
      Module.delete.mockResolvedValue(false);

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete module'
      });
    });

    it('should handle database errors during constraint checking', async () => {
      // Setup: Database error during constraint check
      req.params = { moduleId: '10' };

      Module.findById.mockResolvedValue({ module_id: 10 });
      db.execute.mockRejectedValue(new Error('Database query failed'));

      // Test: Call deleteModule
      await adminController.deleteModule(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error deleting module',
        error: 'Database query failed'
      });
      expect(Module.delete).not.toHaveBeenCalled();
    });
  });
});
