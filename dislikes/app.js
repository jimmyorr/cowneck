const { useState, useEffect } = React;

// --- Configuration ---
const CLIENT_ID = '932685095666-31l2s1psd94msj2a59d2ok7m4dfj3922.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';

// --- Icons ---
const Icon = ({ path, className = "", size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {path}
    </svg>
);

const ThumbsDown = (props) => <Icon {...props} path={<><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></>} />;
const Search = (props) => <Icon {...props} path={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>} />;
const LogIn = (props) => <Icon {...props} path={<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></>} />;
const Music = (props) => <Icon {...props} path={<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>} />;
const User = (props) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;
const ExternalLink = (props) => <Icon {...props} path={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></>} />;
const AlertCircle = (props) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></>} />;
const Loader2 = (props) => <Icon {...props} className={`animate-spin ${props.className || ''}`} path={<path d="M21 12a9 9 0 1 1-6.219-8.56" />} />;

// --- Main Application ---
function App() {
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [videos, setVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Initialize Google API Client
        const checkGapi = setInterval(() => {
            if (window.gapi) {
                clearInterval(checkGapi);
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            discoveryDocs: [DISCOVERY_DOC],
                        });
                        setGapiInited(true);
                    } catch (err) {
                        console.error(err);
                    }
                });
            }
        }, 100);

        // Initialize Google Identity Services
        const checkGis = setInterval(() => {
            if (window.google) {
                clearInterval(checkGis);
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (resp) => {
                        if (resp.error) {
                            setError('Authorization failed: ' + resp.error);
                            return;
                        }
                        setIsAuthenticated(true);
                        fetchDislikes();
                    },
                });
                setTokenClient(client);
                setGisInited(true);
            }
        }, 100);

        return () => {
            clearInterval(checkGapi);
            clearInterval(checkGis);
        };
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredVideos(videos);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredVideos(videos.filter(v =>
                v.snippet.title.toLowerCase().includes(lower) ||
                v.snippet.channelTitle.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, videos]);

    const handleAuthClick = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    };

    const fetchDislikes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await window.gapi.client.youtube.videos.list({
                'myRating': 'dislike',
                'part': 'snippet,contentDetails,statistics',
                'maxResults': 50
            });

            const items = response.result.items || [];
            setVideos(items);
            setFilteredVideos(items);
        } catch (err) {
            console.error("Fetch error", err);
            setError(err?.result?.error?.message || "Failed to fetch disliked videos.");
        } finally {
            setLoading(false);
        }
    };

    const formatViews = (views) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(views);
    };

    const isReady = gapiInited && gisInited;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 p-2 rounded-lg text-white">
                            <ThumbsDown size={20} />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                            YouTube Dislikes
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated && (
                            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Authenticated
                            </div>
                        )}

                        {!isAuthenticated && (
                            <button
                                onClick={handleAuthClick}
                                disabled={!isReady}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isReady
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isReady ? <><LogIn size={18} /> Sign In</> : <><Loader2 size={18} /> Loading API...</>}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
                        <AlertCircle className="mt-0.5 shrink-0" size={20} />
                        <div>
                            <h3 className="font-semibold">Something went wrong</h3>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                            <ThumbsDown size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-3">Your Disliked Videos</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Sign in to view a list of the last 50 videos you've disliked on YouTube. This tool uses the official YouTube API to fetch your private rating history.
                        </p>
                        <button
                            onClick={handleAuthClick}
                            disabled={!isReady}
                            className={`px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 ${isReady
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200'
                                : 'bg-slate-200 text-slate-400'
                                }`}
                        >
                            {isReady ? 'Connect YouTube Account' : 'Initializing...'}
                        </button>
                        <p className="mt-4 text-xs text-slate-400">Read-only access required.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Recent Dislikes</h2>
                                <p className="text-slate-500">Showing {filteredVideos.length} videos</p>
                            </div>

                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    placeholder="Search titles or channels..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm"
                                />
                                <div className="absolute left-3 top-3 text-slate-400">
                                    <Search size={18} />
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Loader2 size={40} />
                                <p className="mt-4">Fetching your dislikes...</p>
                            </div>
                        )}

                        {!loading && videos.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <p className="text-lg text-slate-500">No disliked videos found (or access denied).</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVideos.map((video) => {
                                const isMusic = video.snippet.categoryId === '10';
                                const thumbnail = video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url;

                                return (
                                    <div key={video.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                            <img
                                                src={thumbnail}
                                                alt={video.snippet.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <a
                                                href={`https://www.youtube.com/watch?v=${video.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <div className="bg-red-600 text-white p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                                    <ExternalLink size={24} />
                                                </div>
                                            </a>
                                        </div>

                                        <div className="p-4 flex flex-col flex-grow">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                                                    {video.snippet.title}
                                                </h3>
                                                {isMusic && (
                                                    <span className="shrink-0 bg-cyan-50 text-cyan-700 p-1.5 rounded-md" title="Music Category">
                                                        <Music size={14} />
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="bg-slate-100 p-1 rounded-full">
                                                        <User size={12} className="text-slate-500" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-600 truncate">
                                                        {video.snippet.channelTitle}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-400 gap-3">
                                                    <span>{formatViews(video.statistics.viewCount)} views</span>
                                                    <span>•</span>
                                                    <span>{new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
