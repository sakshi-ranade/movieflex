'use client'

import { Search, X, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { searchMovies, getGenres, getLanguages, getCountries } from '@/app/lib/api'
import { Movie } from '@/app/types'
import MovieThumbnail from './MovieThumbnail'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [results, setResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFilters = async () => {
      if (!isOpen) return

      setError(null)
      try {
        const [genresRes, languagesRes, countriesRes] = await Promise.all([
          getGenres(),
          getLanguages(),
          getCountries()
        ])

        // Sort arrays alphabetically
        const sortedGenres = [...genresRes.genres].sort((a, b) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        )
        const sortedLanguages = [...languagesRes.languages].sort((a, b) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        )
        const sortedCountries = [...countriesRes.countries].sort((a, b) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        )

        setGenres(sortedGenres)
        setLanguages(sortedLanguages)
        setCountries(sortedCountries)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load filters'
        setError(errorMessage)
        console.error('Failed to load filters:', err)
      }
    }

    loadFilters()
  }, [isOpen])

  const handleSearch = async () => {
    if (!query && selectedGenres.length === 0 && !selectedLanguage && !selectedCountry) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await searchMovies({
        query,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        language: selectedLanguage || undefined,
        country: selectedCountry || undefined
      })
      setResults(response.results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      console.error('Search failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Search Movies</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Input and Button */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language Dropdown */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Any Language</option>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Dropdown */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Any Country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre Tags */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Genres
            </label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {isLoading ? (
            <div className="text-center text-white py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-4">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((movie) => (
                <div 
                  key={movie.title}
                  className="flex items-center justify-between bg-gray-900 p-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-semibold">{movie.title}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400 ml-1">{movie.rating.toFixed(1)}</span>
                      <span className="text-gray-400 ml-2">
                        {movie.genres.slice(0, 3).join(', ')}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {movie.language[0]} • {movie.country[0]}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                </div>
              ))}
            </div>
          ) : query || selectedGenres.length > 0 || selectedLanguage || selectedCountry ? (
            <div className="text-center text-gray-400 py-12">
              No movies found matching your search criteria
            </div>
          ) : null}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      )}
    </div>
  )
} 