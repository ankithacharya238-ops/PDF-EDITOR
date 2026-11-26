import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import UploadDropzone from '../components/landing/UploadDropzone';
import RecentDocsSection from '../components/landing/RecentDocsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AboutSection from '../components/landing/AboutSection';
import ParallaxBackground from '../animations/ParallaxBackground';

export default function LandingPage({
  user,
  onOpenAuth,
  onSignOut,
  onFileSelected,
  onLoadSample,
  onCreateBlank,
  recentDocs,
  onOpenRecentDoc,
  onDeleteRecentDoc,
  cursorFxEnabled,
  onToggleCursorFx,
}) {
  const scrollToUpload = () => {
    const el = document.getElementById('upload');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative text-slate-100">
      <ParallaxBackground />

      <div className="relative z-10">
        <Navbar
          user={user}
          onOpenAuth={onOpenAuth}
          onSignOut={onSignOut}
          onStartEditing={scrollToUpload}
          cursorFxEnabled={cursorFxEnabled}
          onToggleCursorFx={onToggleCursorFx}
        />

        <HeroSection onStartEditing={scrollToUpload} onLoadSample={onLoadSample} />

        <UploadDropzone
          onFileSelected={onFileSelected}
          onLoadSample={onLoadSample}
          onCreateBlank={onCreateBlank}
        />

        <RecentDocsSection
          docs={recentDocs}
          onOpenDoc={onOpenRecentDoc}
          onDeleteDoc={onDeleteRecentDoc}
        />

        <FeaturesSection />

        <AboutSection onStartEditing={scrollToUpload} />
      </div>
    </div>
  );
}
