'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: string;
}

export default function SitePandaSEOPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    country: 'US',
    state: '',
    city: '',
    niche: '',
    seedKeywords: ''
  });
  const [isResearching, setIsResearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [showResults, setShowResults] = useState(false);

  const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.country || !formData.state || !formData.city || !formData.niche) {
      return;
    }

    setIsResearching(true);
    
    // Simulate API call - In production, this would call DataForSEO API
    setTimeout(() => {
      const mockKeywords: KeywordData[] = [
        { keyword: `${formData.niche} ${formData.city}`, volume: 1200, difficulty: 45, cpc: 3.50, competition: 'Medium' },
        { keyword: `best ${formData.niche} ${formData.city}`, volume: 890, difficulty: 52, cpc: 4.20, competition: 'High' },
        { keyword: `${formData.niche} near me`, volume: 2400, difficulty: 38, cpc: 2.80, competition: 'Medium' },
        { keyword: `affordable ${formData.niche}`, volume: 650, difficulty: 41, cpc: 3.10, competition: 'Medium' },
        { keyword: `${formData.niche} services`, volume: 1100, difficulty: 48, cpc: 3.90, competition: 'High' },
      ];
      
      setKeywords(mockKeywords);
      setShowResults(true);
      setIsResearching(false);
    }, 2000);
  };

  const handleClear = () => {
    setFormData({
      country: 'US',
      state: '',
      city: '',
      niche: '',
      seedKeywords: ''
    });
    setKeywords([]);
    setShowResults(false);
  };

  const isFormValid = formData.country && formData.state && formData.city && formData.niche;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐼</span>
            <h1 className="text-2xl font-bold text-foreground">SitePanda SEO Research</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/sitepandaseo/competitors')} 
              className="px-4 py-2 text-foreground hover:text-primary transition-smooth font-medium"
            >
              🎯 Competitors
            </button>
            <button 
              onClick={() => router.push('/sitepandaseo/site-plans')} 
              className="px-4 py-2 text-foreground hover:text-primary transition-smooth font-medium"
            >
              📋 Site Plans
            </button>
            <button 
              onClick={() => router.push('/sitepandaseo/content')} 
              className="px-4 py-2 text-foreground hover:text-primary transition-smooth font-medium"
            >
              ✍️ Content
            </button>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth font-medium"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Research Form - Dark Theme */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔍</span>
                <h2 className="text-xl font-bold text-white">Keyword Research</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Country Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🌍</span>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                  </div>
                </div>

                {/* State Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State / Region</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                      disabled={!formData.country}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select state...</option>
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>{state.name}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                  </div>
                </div>

                {/* City Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🏙️</span>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!formData.state}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter city name"
                    />
                  </div>
                </div>

                {/* Niche Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Niche</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🎯</span>
                    <input
                      type="text"
                      value={formData.niche}
                      onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                      placeholder="e.g., plumber, dentist, lawyer"
                    />
                  </div>
                </div>

                {/* Seed Keywords (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seed Keywords <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-gray-500">💡</span>
                    <textarea
                      value={formData.seedKeywords}
                      onChange={(e) => setFormData({ ...formData, seedKeywords: e.target.value })}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth resize-none"
                      placeholder="emergency plumbing&#10;24/7 service&#10;licensed plumber"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={!isFormValid || isResearching}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-smooth font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResearching ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Researching...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Start Research</span>
                      </>
                    )}
                  </button>
                  
                  {showResults && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-full px-6 py-3 bg-[#2a2a2a] text-gray-300 rounded-xl hover:bg-[#333] transition-smooth font-semibold"
                    >
                      Clear Results
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            {!showResults ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Research</h3>
                <p className="text-muted-foreground">
                  Fill out the form to generate keyword insights and competitor analysis for your local SEO strategy.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Keywords Table */}
                <div className="bg-card border border-border rounded-xl shadow-smooth overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <span>📊</span>
                      <span>Keyword Opportunities</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Found {keywords.length} keywords for {formData.niche} in {formData.city}, {formData.state}
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Keyword</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Volume</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Difficulty</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">CPC</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Competition</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {keywords.map((kw, index) => (
                          <tr key={index} className="hover:bg-muted/50 transition-smooth">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{kw.keyword}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{kw.volume.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                kw.difficulty < 40 ? 'bg-success/10 text-success' :
                                kw.difficulty < 60 ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {kw.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">${kw.cpc.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{kw.competition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg. Monthly Volume</div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(keywords.reduce((sum, kw) => sum + kw.volume, 0) / keywords.length).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg. Difficulty</div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(keywords.reduce((sum, kw) => sum + kw.difficulty, 0) / keywords.length)}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg. CPC</div>
                    <div className="text-2xl font-bold text-foreground">
                      ${(keywords.reduce((sum, kw) => sum + kw.cpc, 0) / keywords.length).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

