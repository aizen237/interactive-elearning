import { useNavigate } from 'react-router-dom';
import FidelChart from '../components/FidelChart';

function FidelChartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Amharic Alphabet Reference
          </h1>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Page Description */}
        <div className="mb-6">
          <p className="text-2xl text-gray-600 mb-2" style={{ fontFamily: "'Abyssinica SIL', serif" }}>
            የአማርኛ ፊደላት
          </p>
          <p className="text-gray-600">
            Complete reference chart of the Amharic Fidel alphabet with all 33 consonant families and their 7 vowel modifications.
          </p>
        </div>

        {/* Fidel Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <FidelChart />
        </div>
      </div>
    </div>
  );
}

export default FidelChartPage;
