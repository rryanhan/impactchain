// frontend/src/App.jsx
import React from 'react';
// index.css already includes the Tailwind directives and @font-face
import './index.css';

import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import CreateImpactChain from './pages/CreateImpactChain.jsx';
import CampaignDetailPage from './pages/CampaignDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ExploreImpactChains from './components/ExploreImpactChains.jsx';

import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <div className="font-antarctica min-h-screen bg-gray-50 antialiased">
            <div className="fixed top-0 left-0 right-0 z-50 ">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Navbar />
                </div>
            </div>
            <main className="pt-24">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Define the routes for your application */}
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/create" element={<CreateImpactChain />} />
                        <Route path="/explore" element={<ExploreImpactChains />} />
                        <Route path="/campaigns/:contractAddress" element={<CampaignDetailPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;