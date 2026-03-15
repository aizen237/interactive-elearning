import { useState, useEffect } from 'react';
import axios from 'axios';

function ContentManagement() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [content, setContent] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    question_text: '',
    correct_answer: '',
    difficulty: 'Easy',
    options: ['', '', '', ''],
    explanation: '',
  });

  const [file, setFile] = useState(null);

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // Fetch modules on load
  useEffect(() => {
    fetchModules();
  }, []);

  // Fetch content when module is selected
  useEffect(() => {
    if (selectedModule) {
      fetchContent(selectedModule);
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/modules`);
      setModules(response.data.data);
    } catch (err) {
        console.error(err);
      setError('Failed to load modules');
    }
  };

  const fetchContent = async (moduleId) => {
    try {
      const response = await axios.get(`${API_URL}/content/module/${moduleId}`);
      setContent(response.data.data);
    } catch (err) {
        console.error(err);
      setError('Failed to load content');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('module_id', selectedModule);
      data.append('question_text', formData.question_text);
      data.append('correct_answer', formData.correct_answer);
      data.append('difficulty', formData.difficulty);
      data.append('options', JSON.stringify(formData.options));
      data.append('explanation', formData.explanation);
      
      if (file) {
        data.append('media', file);
      }

      await axios.post(`${API_URL}/content`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Content created successfully!');
      setShowForm(false);
      fetchContent(selectedModule);
      
      // Reset form
      setFormData({
        question_text: '',
        correct_answer: '',
        difficulty: 'Easy',
        options: ['', '', '', ''],
        explanation: '',
      });
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Content Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Module Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Module</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((module) => (
              <button
                key={module.module_id}
                onClick={() => setSelectedModule(module.module_id)}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedModule === module.module_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <h3 className="font-semibold">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content List & Form */}
        {selectedModule && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Content Items</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {showForm ? 'Cancel' : 'Add New Content'}
                </button>
              </div>

              {/* Content List */}
              <div className="space-y-3">
                {content.length === 0 ? (
                  <p className="text-gray-500">No content yet. Create your first quiz!</p>
                ) : (
                  content.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.question_text}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Answer: {item.correct_answer} | Difficulty: {item.difficulty}
                          </p>
                        </div>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {item.item_type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Create Content Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Create Quiz Question</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Question Text
                    </label>
                    <textarea
                      name="question_text"
                      value={formData.question_text}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {formData.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-gray-700 font-medium mb-2">
                          Option {index + 1}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        name="correct_answer"
                        value={formData.correct_answer}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Upload Image/Audio (Optional)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,audio/*"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Content'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContentManagement;