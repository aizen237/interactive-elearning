import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LessonViewer() {
  const [modules, setModules] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/content`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setModules(response.data.data);
        setLoading(false);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError('Failed to load content');
        setLoading(false);
      }
    };

    fetchContent();
  }, [ token]);

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setSelectedAnswer('');
    setSubmitted(false);
    setResult(null);
  };

  const handleBackToList = () => {
    setSelectedContent(null);
    setSelectedAnswer('');
    setSubmitted(false);
    setResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer first!');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/student/submit`,
        {
          content_id: selectedContent.id,
          selected_answer: selectedAnswer
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const resultData = response.data.data;
      setResult(resultData);
      setSubmitted(true);

      // Show badge modal if new badges earned
      if (resultData.newBadges && resultData.newBadges.length > 0) {
        setEarnedBadges(resultData.newBadges);
        setShowBadgeModal(true);
      }

      // Show level up modal if leveled up (after badge modal)
      if (resultData.leveledUp) {
        setTimeout(() => {
          setShowLevelUpModal(true);
        }, resultData.newBadges?.length > 0 ? 3000 : 0);
      }
    } catch (error) {
      alert('Failed to submit answer: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer('');
    setSubmitted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading lessons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {selectedContent ? selectedContent.module_name : 'My Lessons'}
          </h1>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Content View or List */}
        {!selectedContent ? (
          // Module & Content List
          <div className="space-y-6">
            {modules.map((module) => (
              <div key={module.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📚</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{module.module_name}</h2>
                    <p className="text-gray-600">{module.description}</p>
                  </div>
                </div>

                {/* Content Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {module.content.length === 0 ? (
                    <p className="text-gray-500 col-span-2">No content available yet</p>
                  ) : (
                    module.content.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleContentClick(item)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {item.item_type === 'Quiz' ? '🎯' : '📖'}
                          </span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.question_text}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {item.item_type}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single Content View
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={handleBackToList}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to lessons
            </button>

            {/* Content Display */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedContent.question_text}
                </h2>
                <div className="flex gap-2">
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded">
                    {selectedContent.item_type}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded ${
                    selectedContent.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    selectedContent.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedContent.difficulty}
                  </span>
                </div>
              </div>

              {/* Image if exists */}
              {selectedContent.file_path && (
                <div className="flex justify-center">
                  <img
                    src={`http://localhost:5000/uploads/images/${selectedContent.file_path}`}
                    alt="Content media"
                    className="max-w-md rounded-lg shadow-lg"
                  />
                </div>
              )}

              {/* Options */}
              {selectedContent.options && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Choose your answer:</h3>
                  {JSON.parse(selectedContent.options).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !submitted && setSelectedAnswer(option)}
                      disabled={submitted}
                      className={`w-full p-4 border-2 rounded-lg text-left transition ${
                        submitted
                          ? result?.isCorrect && option === selectedContent.correct_answer
                            ? 'border-green-500 bg-green-50'
                            : option === result?.selectedAnswer && !result?.isCorrect
                            ? 'border-red-500 bg-red-50'
                            : option === selectedContent.correct_answer
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                          : selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400 cursor-pointer'
                      } ${submitted ? 'cursor-not-allowed' : ''}`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                      {option}
                      {submitted && option === selectedContent.correct_answer && (
                        <span className="ml-2 text-green-600">✓ Correct</span>
                      )}
                      {submitted && option === result?.selectedAnswer && !result?.isCorrect && (
                        <span className="ml-2 text-red-600">✗ Wrong</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Result & Explanation */}
              {submitted && result && (
                <>
                  {/* Main Result Box */}
                  <div className={`border-l-4 p-4 rounded ${
                    result.isCorrect 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${
                      result.isCorrect ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                    </h3>
                    <p className={result.isCorrect ? 'text-green-800' : 'text-red-800'}>
                      {result.isCorrect 
                        ? `Great job! You earned ${result.score} points!`
                        : `The correct answer is: ${result.correctAnswer}`
                      }
                    </p>
                    {selectedContent.explanation && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="font-semibold text-gray-700">💡 Explanation:</p>
                        <p className="text-gray-700 mt-1">{selectedContent.explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* XP and Level Info (only if correct) */}
                  {result.isCorrect && (
                    result.alreadyCompleted ? (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-400 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">✅</span>
                          <div>
                            <p className="text-lg font-bold text-blue-900">
                              Already Completed!
                            </p>
                            <p className="text-sm text-blue-700">
                              No XP awarded - you've already passed this question
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : result.xpEarned > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-orange-900">
                              ⭐ +{result.xpEarned} XP Earned!
                            </p>
                            <p className="text-sm text-orange-700 mt-1">
                              Total XP: {result.totalXP} | Level: {result.currentLevel}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}

              {/* Submit/Try Again Buttons */}
              {!submitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleTryAgain}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Badge Award Modal */}
        {showBadgeModal && earnedBadges.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="text-9xl animate-pulse">🏆</div>
                <h2 className="text-5xl font-black text-white drop-shadow-lg">
                  NEW BADGE{earnedBadges.length > 1 ? 'S' : ''} UNLOCKED!
                </h2>
                
                <div className="space-y-4">
                  {earnedBadges.map((badge) => (
                    <div key={badge.id} className="bg-white bg-opacity-20 rounded-2xl p-6 backdrop-blur">
                      <div className="text-6xl mb-3">{badge.icon_url}</div>
                      <h3 className="text-3xl font-bold text-white">{badge.name}</h3>
                      <p className="text-xl text-yellow-100 mt-2">{badge.description}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="mt-6 bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-100 transform hover:scale-110 transition shadow-lg"
                >
                  Awesome! 🎉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Level Up Modal */}
        {showLevelUpModal && result?.leveledUp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="text-9xl">🎊</div>
                <h2 className="text-6xl font-black text-white drop-shadow-lg">
                  LEVEL UP!
                </h2>
                <div className="text-8xl font-black text-yellow-100 drop-shadow-lg animate-pulse">
                  {result.currentLevel}
                </div>
                <p className="text-2xl font-bold text-white">
                  Congratulations! You reached Level {result.currentLevel}!
                </p>
                <p className="text-xl text-yellow-100">
                  Total XP: {result.totalXP}
                </p>
                <button
                  onClick={() => setShowLevelUpModal(false)}
                  className="mt-6 bg-white text-orange-600 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-100 transform hover:scale-110 transition shadow-lg"
                >
                  Continue Learning! 🚀
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonViewer;