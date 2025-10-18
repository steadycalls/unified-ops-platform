'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Competitor {
  name: string;
  domain: string;
  type: 'map_pack' | 'organic';
  rating?: number;
  reviews?: number;
  phone?: string;
  website?: string;
  position: number;
  hasServiceInTitle: boolean;
  hasCityInTitle: boolean;
}

export default function CompetitorAnalysisPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    keyword: '',
    location: '',
    depth: '10'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({
    mapPackCount: 0,
    organicCount: 0,
    avgRating: 0,
    avgReviews: 0,
    withWebsite: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.keyword || !formData.location) {
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call - In production, this would call DataForSEO API
    setTimeout(() => {
      const mockCompetitors: Competitor[] = [
        {
          name: 'ABC Plumbing Services',
          domain: 'abcplumbing.com',
          type: 'map_pack',
          rating: 4.8,
          reviews: 245,
          phone: '(555) 123-4567',
          website: 'https://abcplumbing.com',
          position: 1,
          hasServiceInTitle: true,
          hasCityInTitle: true
        },
        {
          name: 'Quick Fix Plumbers',
          domain: 'quickfixplumbers.com',
          type: 'map_pack',
          rating: 4.6,
          reviews: 189,
          phone: '(555) 234-5678',
          website: 'https://quickfixplumbers.com',
          position: 2,
          hasServiceInTitle: true,
          hasCityInTitle: false
        },
        {
          name: 'Best Plumbing Company',
          domain: 'bestplumbingco.com',
          type: 'organic',
          position: 1,
          hasServiceInTitle: true,
          hasCityInTitle: true,
          website: 'https://bestplumbingco.com'
        },
        {
          name: 'Local Plumber Directory',
          domain: 'localplumbers.com',
          type: 'organic',
          position: 2,
          hasServiceInTitle: true,
          hasCityInTitle: false,
          website: 'https://localplumbers.com'
        },
        {
          name: '24/7 Emergency Plumbing',
          domain: '247plumbing.com',
          type: 'map_pack',
          rating: 4.9,
          reviews: 312,
          phone: '(555) 345-6789',
          website: 'https://247plumbing.com',
          position: 3,
          hasServiceInTitle: true,
          hasCityInTitle: false
        },
      ];
      
      setCompetitors(mockCompetitors);
      
      const mapPack = mockCompetitors.filter(c => c.type === 'map_pack');
      const organic = mockCompetitors.filter(c => c.type === 'organic');
      
      setStats({
        mapPackCount: mapPack.length,
        organicCount: organic.length,
        avgRating: mapPack.reduce((sum, c) => sum + (c.rating || 0), 0) / mapPack.length,
        avgReviews: Math.round(mapPack.reduce((sum, c) => sum + (c.reviews || 0), 0) / mapPack.length),
        withWebsite: mockCompetitors.filter(c => c.website).length
      });
      
      setShowResults(true);
      setIsAnalyzing(false);
    }, 2500);
  };

  const handleClear = () => {
    setFormData({ keyword: '', location: '', depth: '10' });
    setCompetitors([]);
    setShowResults(false);
  };

  const handleExport = () => {
    const csvHeaders = ['Name', 'Domain', 'Type', 'Position', 'Rating', 'Reviews', 'Phone', 'Website', 'Service in Title', 'City in Title'];
    const csvData = competitors.map(c => [
      c.name,
      c.domain,
      c.type,
      c.position,
      c.rating || 'N/A',
      c.reviews || 'N/A',
      c.phone || 'N/A',
      c.website || 'N/A',
      c.hasServiceInTitle ? 'Yes' : 'No',
      c.hasCityInTitle ? 'Yes' : 'No'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'competitors-analysis.csv';
    link.click();
  };

  const isFormValid = formData.keyword && formData.location;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl font-bold text-foreground">Competitor Analysis</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/sitepandaseo')} 
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth font-medium"
            >
              ← Back to Research
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔎</span>
                <h2 className="text-xl font-bold text-white">Analyze Competitors</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Keyword Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Keyword</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🎯</span>
                    <input
                      type="text"
                      value={formData.keyword}
                      onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                      placeholder="e.g., plumber, dentist"
                    />
                  </div>
                </div>

                {/* Location Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                      placeholder="City, State"
                    />
                  </div>
                </div>

                {/* Analysis Depth */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Depth</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📊</span>
                    <select
                      value={formData.depth}
                      onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                    >
                      <option value="5">Top 5 Results</option>
                      <option value="10">Top 10 Results</option>
                      <option value="20">Top 20 Results</option>
                      <option value="50">Top 50 Results</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={!isFormValid || isAnalyzing}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-smooth font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Analyze Competitors</span>
                      </>
                    )}
                  </button>
                  
                  {showResults && (
                    <>
                      <button
                        type="button"
                        onClick={handleExport}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-smooth font-semibold"
                      >
                        📥 Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="w-full px-6 py-3 bg-[#2a2a2a] text-gray-300 rounded-xl hover:bg-[#333] transition-smooth font-semibold"
                      >
                        Clear Results
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            {!showResults ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground">
                  Enter a keyword and location to discover who's ranking and analyze their strategies.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Map Pack</div>
                    <div className="text-3xl font-bold text-foreground">{stats.mapPackCount}</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Organic</div>
                    <div className="text-3xl font-bold text-foreground">{stats.organicCount}</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg Rating</div>
                    <div className="text-3xl font-bold text-foreground">{stats.avgRating.toFixed(1)} ⭐</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg Reviews</div>
                    <div className="text-3xl font-bold text-foreground">{stats.avgReviews}</div>
                  </div>
                </div>

                {/* Competitors Table */}
                <div className="bg-card border border-border rounded-xl shadow-smooth overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <span>📋</span>
                      <span>Competitor Rankings</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Found {competitors.length} competitors for "{formData.keyword}" in {formData.location}
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Position</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Business</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Rating</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Reviews</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Optimization</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {competitors.map((comp, index) => (
                          <tr key={index} className="hover:bg-muted/50 transition-smooth">
                            <td className="px-6 py-4 text-sm font-bold text-foreground">#{comp.position}</td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-foreground">{comp.name}</div>
                              <div className="text-xs text-muted-foreground">{comp.domain}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                comp.type === 'map_pack' 
                                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                  : 'bg-green-500/10 text-green-500 border border-green-500/20'
                              }`}>
                                {comp.type === 'map_pack' ? 'Map Pack' : 'Organic'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {comp.rating ? `${comp.rating} ⭐` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {comp.reviews ? comp.reviews.toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {comp.hasServiceInTitle && (
                                  <span className="px-2 py-1 rounded text-xs bg-success/10 text-success">Service ✓</span>
                                )}
                                {comp.hasCityInTitle && (
                                  <span className="px-2 py-1 rounded text-xs bg-success/10 text-success">City ✓</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

